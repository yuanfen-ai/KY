#!/bin/bash

# KY 项目启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装"
        return 1
    fi
    return 0
}

# 检查Docker
check_docker() {
    if check_command docker; then
        log_info "Docker 已安装: $(docker --version)"
    else
        log_error "请先安装 Docker"
        echo "  Ubuntu: curl -fsSL https://get.docker.com | sh"
        echo "  CentOS: yum install docker"
        exit 1
    fi
}

# 检查Docker Compose
check_docker_compose() {
    if check_command docker-compose; then
        log_info "Docker Compose 已安装: $(docker-compose --version)"
    else
        log_error "请先安装 Docker Compose"
        echo "  安装: sudo apt install docker-compose"
        exit 1
    fi
}

# 检查Node.js
check_node() {
    if check_command node; then
        log_info "Node.js 已安装: $(node --version)"
    else
        log_error "请先安装 Node.js 20.x LTS"
        echo "  使用 nvm 安装: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "  然后运行: nvm install 20"
        exit 1
    fi
}

# 检查pnpm
check_pnpm() {
    if check_command pnpm; then
        log_info "pnpm 已安装: $(pnpm --version)"
    else
        log_warn "pnpm 未安装，正在安装..."
        npm install -g pnpm
    fi
}

# 启动数据库服务
start_database() {
    log_info "启动数据库服务..."
    
    # 检查是否已有运行的容器
    if docker ps | grep -q "ky-mysql"; then
        log_warn "MySQL 容器已在运行"
    else
        docker-compose up -d mysql redis
        log_info "等待数据库启动..."
        sleep 10
    fi
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    # 等待MySQL完全启动
    until docker exec ky-mysql mysqladmin ping -h localhost --silent; do
        log_info "等待MySQL启动..."
        sleep 2
    done
    
    # 导入数据库结构
    docker exec -i ky-mysql mysql -uroot -proot ky_project < database/schema.sql 2>/dev/null || true
    log_info "数据库初始化完成"
}

# 安装后端依赖
install_backend() {
    log_info "安装后端依赖..."
    cd proxy-server
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi
    cd ..
}

# 安装前端依赖
install_frontend() {
    log_info "安装前端依赖..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi
    cd ..
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    cd proxy-server
    
    # 检查是否已有进程运行
    if pgrep -f "node.*dist/index.js" > /dev/null; then
        log_warn "后端服务已在运行"
    else
        if [ ! -d "dist" ]; then
            log_info "构建后端..."
            pnpm build
        fi
        
        # 使用nohup后台运行
        nohup node dist/index.js > ../logs/backend.log 2>&1 &
        echo $! > ../logs/backend.pid
        log_info "后端服务已启动 (PID: $(cat ../logs/backend.pid))"
    fi
    
    cd ..
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    cd frontend
    
    # 检查是否已有进程运行
    if pgrep -f "vite" > /dev/null; then
        log_warn "前端服务已在运行"
    else
        # 使用nohup后台运行
        nohup pnpm dev > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        log_info "前端服务已启动 (PID: $(cat ../logs/frontend.pid))"
    fi
    
    cd ..
}

# 显示服务状态
show_status() {
    echo ""
    log_info "=== 服务状态 ==="
    
    # MySQL
    if docker ps | grep -q "ky-mysql"; then
        echo -e "${GREEN}✓${NC} MySQL: 运行中"
    else
        echo -e "${RED}✗${NC} MySQL: 未运行"
    fi
    
    # Redis
    if docker ps | grep -q "ky-redis"; then
        echo -e "${GREEN}✓${NC} Redis: 运行中"
    else
        echo -e "${RED}✗${NC} Redis: 未运行"
    fi
    
    # 后端
    if pgrep -f "node.*dist/index.js" > /dev/null; then
        echo -e "${GREEN}✓${NC} 后端: 运行中 (端口 5000)"
    else
        echo -e "${RED}✗${NC} 后端: 未运行"
    fi
    
    # 前端
    if pgrep -f "vite" > /dev/null; then
        echo -e "${GREEN}✓${NC} 前端: 运行中 (端口 3000)"
    else
        echo -e "${RED}✗${NC} 前端: 未运行"
    fi
    
    echo ""
    log_info "=== 访问地址 ==="
    echo "  前端: http://localhost:3000"
    echo "  后端: ws://localhost:5000/ws"
    echo ""
}

# 停止所有服务
stop_all() {
    log_info "停止所有服务..."
    
    # 停止前端
    if [ -f "logs/frontend.pid" ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm logs/frontend.pid 2>/dev/null || true
    fi
    
    # 停止后端
    if [ -f "logs/backend.pid" ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm logs/backend.pid 2>/dev/null || true
    fi
    
    # 停止数据库
    docker-compose down
    
    log_info "所有服务已停止"
}

# 查看日志
show_logs() {
    local service=$1
    
    case $service in
        backend)
            tail -f logs/backend.log 2>/dev/null || log_error "后端日志文件不存在"
            ;;
        frontend)
            tail -f logs/frontend.log 2>/dev/null || log_error "前端日志文件不存在"
            ;;
        mysql)
            docker logs -f ky-mysql
            ;;
        redis)
            docker logs -f ky-redis
            ;;
        *)
            log_error "未知服务: $service"
            echo "可用服务: backend, frontend, mysql, redis"
            ;;
    esac
}

# 主函数
main() {
    # 创建日志目录
    mkdir -p logs
    
    # 解析命令
    case $1 in
        start)
            log_info "开始启动 KY 项目..."
            check_docker
            check_docker_compose
            check_node
            check_pnpm
            start_database
            init_database
            install_backend
            install_frontend
            start_backend
            start_frontend
            sleep 3
            show_status
            log_info "项目启动完成！"
            ;;
        stop)
            stop_all
            ;;
        restart)
            stop_all
            sleep 2
            $0 start
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs $2
            ;;
        *)
            echo "用法: $0 {start|stop|restart|status|logs [service]}"
            echo ""
            echo "命令:"
            echo "  start   - 启动所有服务"
            echo "  stop    - 停止所有服务"
            echo "  restart - 重启所有服务"
            echo "  status  - 查看服务状态"
            echo "  logs    - 查看日志 [backend|frontend|mysql|redis]"
            echo ""
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
