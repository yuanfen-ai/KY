#!/bin/bash

# KY 项目启动脚本（无Docker版本）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
KY 项目启动脚本（无Docker版本）

用法: $0 [command]

命令:
  start     启动所有服务（前端 + 后端）
  stop      停止所有服务
  status    查看服务状态
  logs      查看日志 (backend/frontend)
  restart   重启所有服务
  help      显示此帮助信息

示例:
  $0 start           # 启动所有服务
  $0 logs backend    # 查看后端日志
  $0 stop            # 停止所有服务

EOF
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装"
        return 1
    fi
    return 0
}

# 检查Node.js
check_node() {
    if check_command node; then
        log_info "Node.js: $(node --version)"
    else
        log_error "请先安装 Node.js"
        exit 1
    fi
    
    if check_command pnpm; then
        log_info "pnpm: $(pnpm --version)"
    else
        log_error "请先安装 pnpm: npm install -g pnpm"
        exit 1
    fi
}

# 创建必要的目录
setup_directories() {
    log_step "创建必要的目录..."
    mkdir -p logs
    mkdir -p proxy-server/logs
}

# 安装后端依赖
install_backend() {
    log_step "检查后端依赖..."
    cd proxy-server
    if [ ! -d "node_modules" ]; then
        log_info "安装后端依赖..."
        pnpm install
    else
        log_info "后端依赖已安装"
    fi
    cd ..
}

# 安装前端依赖
install_frontend() {
    log_step "检查前端依赖..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        pnpm install
    else
        log_info "前端依赖已安装"
    fi
    cd ..
}

# 停止现有服务
stop_services() {
    log_step "停止现有服务..."
    
    # 停止后端
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null || true
            log_info "后端服务已停止 (PID: $BACKEND_PID)"
        fi
        rm -f logs/backend.pid
    fi
    
    # 停止前端
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID 2>/dev/null || true
            log_info "前端服务已停止 (PID: $FRONTEND_PID)"
        fi
        rm -f logs/frontend.pid
    fi
    
    # 清理残留进程
    pkill -f "node.*proxy-server.*dist/index.js" 2>/dev/null || true
    pkill -f "vite.*frontend" 2>/dev/null || true
    
    sleep 2
}

# 启动后端服务
start_backend() {
    log_step "启动后端服务..."
    cd proxy-server
    
    # 构建后端（如果需要）
    if [ ! -d "dist" ]; then
        log_info "构建后端..."
        pnpm build
    fi
    
    # 检查是否已有进程运行
    if pgrep -f "node.*dist/index.js" > /dev/null; then
        log_warn "后端服务已在运行"
    else
        # 使用nohup后台运行
        nohup node dist/index.js > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../logs/backend.pid
        log_info "后端服务已启动 (PID: $BACKEND_PID)"
        
        # 等待服务启动
        sleep 3
        
        # 检查进程是否还在运行
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            log_info "✓ 后端服务启动成功"
        else
            log_error "✗ 后端服务启动失败，请查看日志: logs/backend.log"
            exit 1
        fi
    fi
    
    cd ..
}

# 启动前端服务
start_frontend() {
    log_step "启动前端服务..."
    cd frontend
    
    # 检查是否已有进程运行
    if pgrep -f "vite" > /dev/null; then
        log_warn "前端服务已在运行"
    else
        # 使用nohup后台运行
        nohup pnpm dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../logs/frontend.pid
        log_info "前端服务已启动 (PID: $FRONTEND_PID)"
        
        # 等待服务启动
        sleep 5
        
        # 检查进程是否还在运行
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log_info "✓ 前端服务启动成功"
        else
            log_error "✗ 前端服务启动失败，请查看日志: logs/frontend.log"
            exit 1
        fi
    fi
    
    cd ..
}

# 显示服务状态
show_status() {
    echo ""
    log_info "=== 服务状态 ==="
    echo ""
    
    # 后端
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} 后端: 运行中 (PID: $BACKEND_PID, 端口 5000)"
        else
            echo -e "${RED}✗${NC} 后端: 未运行 (PID文件存在但进程不存在)"
        fi
    else
        if pgrep -f "node.*dist/index.js" > /dev/null; then
            echo -e "${YELLOW}⚠${NC} 后端: 运行中（无PID文件）"
        else
            echo -e "${RED}✗${NC} 后端: 未运行"
        fi
    fi
    
    # 前端
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} 前端: 运行中 (PID: $FRONTEND_PID, 端口 3000)"
        else
            echo -e "${RED}✗${NC} 前端: 未运行 (PID文件存在但进程不存在)"
        fi
    else
        if pgrep -f "vite" > /dev/null; then
            echo -e "${YELLOW}⚠${NC} 前端: 运行中（无PID文件）"
        else
            echo -e "${RED}✗${NC} 前端: 未运行"
        fi
    fi
    
    echo ""
    log_info "=== 端口检查 ==="
    echo ""
    
    # 检查端口
    for port in 3000 5000; do
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${GREEN}✓${NC} 端口 $port: 已监听"
        else
            echo -e "${RED}✗${NC} 端口 $port: 未监听"
        fi
    done
    
    echo ""
}

# 显示日志
show_logs() {
    SERVICE=$1
    
    if [ -z "$SERVICE" ]; then
        log_error "请指定服务: backend 或 frontend"
        echo "示例: $0 logs backend"
        exit 1
    fi
    
    LOG_FILE="logs/${SERVICE}.log"
    
    if [ ! -f "$LOG_FILE" ]; then
        log_error "日志文件不存在: $LOG_FILE"
        exit 1
    fi
    
    log_info "显示 $SERVICE 日志（按Ctrl+C退出）..."
    tail -f "$LOG_FILE"
}

# 启动所有服务
start_all() {
    log_info "开始启动 KY 项目..."
    echo ""
    
    check_node
    setup_directories
    install_backend
    install_frontend
    
    stop_services
    
    start_backend
    start_frontend
    
    echo ""
    log_info "=== KY 项目启动完成 ==="
    echo ""
    log_info "访问地址:"
    echo "  - 前端: http://localhost:3000"
    echo "  - 后端: ws://localhost:5000/ws"
    echo ""
    log_info "管理命令:"
    echo "  - 查看状态: $0 status"
    echo "  - 查看日志: $0 logs [backend|frontend]"
    echo "  - 停止服务: $0 stop"
    echo ""
    
    # 显示状态
    show_status
}

# 重启所有服务
restart_all() {
    log_info "重启 KY 项目..."
    stop_services
    start_all
}

# 主逻辑
case "$1" in
    start)
        start_all
        ;;
    stop)
        stop_services
        log_info "所有服务已停止"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs $2
        ;;
    restart)
        restart_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
