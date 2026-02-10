#!/bin/bash

# KY 项目启动脚本（无数据库版本，用于前端演示）

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
KY 项目启动脚本（无数据库版本）

用法: $0 [command]

命令:
  start     启动前端服务（用于演示）
  stop      停止前端服务
  status    查看服务状态
  logs      查看日志
  help      显示此帮助信息

注意:
  - 此版本仅启动前端服务，后端需要MySQL数据库
  - 如需启动完整服务，请先安装MySQL

EOF
}

# 检查Node.js
check_node() {
    if command -v node &> /dev/null; then
        log_info "Node.js: $(node --version)"
    else
        log_error "请先安装 Node.js"
        exit 1
    fi
    
    if command -v pnpm &> /dev/null; then
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
    pkill -f "vite.*frontend" 2>/dev/null || true
    
    sleep 2
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
    
    # 后端
    echo -e "${YELLOW}⚠${NC} 后端: 需要MySQL数据库，未启动"
    
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
    LOG_FILE="logs/frontend.log"
    
    if [ ! -f "$LOG_FILE" ]; then
        log_error "日志文件不存在: $LOG_FILE"
        exit 1
    fi
    
    log_info "显示前端日志（按Ctrl+C退出）..."
    tail -f "$LOG_FILE"
}

# 启动所有服务
start_all() {
    log_info "开始启动 KY 项目（仅前端，演示模式）..."
    echo ""
    
    log_warn "注意：后端服务需要MySQL数据库，当前未启动"
    echo ""
    
    check_node
    setup_directories
    install_frontend
    
    stop_services
    
    start_frontend
    
    echo ""
    log_info "=== KY 项目启动完成（演示模式）==="
    echo ""
    log_info "访问地址:"
    echo "  - 前端: http://localhost:3000"
    echo ""
    log_warn "后端服务未启动（需要MySQL数据库）"
    log_warn "如需启动完整服务，请先安装MySQL并运行: ./start-simple.sh"
    echo ""
    log_info "管理命令:"
    echo "  - 查看状态: $0 status"
    echo "  - 查看日志: $0 logs"
    echo "  - 停止服务: $0 stop"
    echo ""
    
    # 显示状态
    show_status
}

# 主逻辑
case "$1" in
    start)
        start_all
        ;;
    stop)
        stop_services
        log_info "前端服务已停止"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
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
