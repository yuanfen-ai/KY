#!/bin/bash

# 手持察打一体设备 - 前端服务启动脚本
# 绕过 coze CLI，直接使用原生命令启动

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

# 检查 Node.js
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

# 安装依赖
install_dependencies() {
    log_step "检查并安装依赖..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        log_info "安装依赖..."
        pnpm install
    else
        log_info "依赖已安装"
    fi
    
    cd ..
}

# 构建项目
build_project() {
    log_step "构建项目..."
    cd frontend
    pnpm run build
    cd ..
}

# 停止现有服务
stop_services() {
    log_step "停止现有服务..."
    
    # 停止前端服务
    if pgrep -f "node.*server.mjs" > /dev/null; then
        pkill -f "node.*server.mjs"
        log_info "前端服务已停止"
    fi
    
    sleep 2
}

# 启动前端服务
start_frontend() {
    log_step "启动前端服务..."
    cd frontend
    
    # 检查是否已有进程运行
    if pgrep -f "node.*server.mjs" > /dev/null; then
        log_warn "前端服务已在运行"
    else
        # 使用 nohup 后台运行
        nohup node server.mjs > /tmp/frontend.log 2>&1 &
        
        # 等待服务启动
        sleep 3
        
        # 检查进程是否还在运行
        if pgrep -f "node.*server.mjs" > /dev/null; then
            log_info "✓ 前端服务启动成功 (PID: $(pgrep -f 'node.*server.mjs' | awk '{print $1}'))"
            log_info "📁 日志文件: /tmp/frontend.log"
        else
            log_error "✗ 前端服务启动失败，请查看日志: /tmp/frontend.log"
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
    if pgrep -f "node.*server.mjs" > /dev/null; then
        echo -e "${GREEN}✓${NC} 前端: 运行中 (PID: $(pgrep -f 'node.*server.mjs' | awk '{print $1}'))"
    else
        echo -e "${RED}✗${NC} 前端: 未运行"
    fi
    
    echo ""
    log_info "=== 端口检查 ==="
    echo ""
    
    # 检查端口
    if ss -tuln 2>/dev/null | grep -q ":5000 "; then
        echo -e "${GREEN}✓${NC} 端口 5000: 已监听"
    else
        echo -e "${RED}✗${NC} 端口 5000: 未监听"
    fi
    
    echo ""
}

# 显示日志
show_logs() {
    LOG_FILE="/tmp/frontend.log"
    
    if [ ! -f "$LOG_FILE" ]; then
        log_error "日志文件不存在: $LOG_FILE"
        exit 1
    fi
    
    log_info "显示前端日志（按Ctrl+C退出）..."
    tail -f "$LOG_FILE"
}

# 显示帮助信息
show_help() {
    cat << EOF
手持察打一体设备 - 前端服务启动脚本

用法: $0 [command]

命令:
  install   安装依赖
  build     构建项目
  start     启动前端服务
  stop      停止前端服务
  restart   重启前端服务
  status    查看服务状态
  logs      查看日志
  help      显示此帮助信息

示例:
  $0 install   # 安装依赖
  $0 build     # 构建项目
  $0 start     # 启动服务
  $0 status    # 查看状态
  $0 logs      # 查看日志
  $0 stop      # 停止服务

注意:
  - 此脚本绕过 coze CLI，直接使用原生命令
  - 避免 "can only join an iterable" 错误
  - 日志文件: /tmp/frontend.log

EOF
}

# 主函数
main() {
    case "${1:-help}" in
        install)
            check_node
            install_dependencies
            ;;
        build)
            check_node
            install_dependencies
            build_project
            ;;
        start)
            check_node
            install_dependencies
            build_project
            stop_services
            start_frontend
            show_status
            log_info "访问地址: http://localhost:5000"
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_frontend
            show_status
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        help)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
