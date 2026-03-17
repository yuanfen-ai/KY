#!/bin/bash
# 服务管理脚本 - 一键启动/停止/重启/检查前端服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOG_FILE="/app/work/logs/bypass/dev.log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查服务是否运行
is_running() {
    if pgrep -f "node.*server.mjs" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 启动服务
start_service() {
    log_step "启动前端服务..."
    cd "$FRONTEND_DIR"

    if is_running; then
        log_warn "服务已在运行中"
        return 0
    fi

    # 确保日志目录存在
    mkdir -p /app/work/logs/bypass
    
    # 使用静态文件服务器（已构建）
    log_info "启动静态文件服务器..."
    nohup node server.mjs >> "$LOG_FILE" 2>&1 &
    
    # 等待服务启动
    log_info "等待服务启动（5秒）..."
    sleep 5
    
    # 检查服务是否启动成功
    if is_running; then
        log_info "✓ 服务启动成功"
        log_info "访问地址: http://localhost:5000"
    else
        log_error "服务启动失败，请检查日志: $LOG_FILE"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_step "停止前端服务..."

    if ! is_running; then
        log_warn "服务未运行"
        return 0
    fi

    pkill -f "node.*server.mjs" 2>/dev/null || true
    sleep 2

    if is_running; then
        log_error "无法停止服务，尝试强制停止..."
        pkill -9 -f "node.*server.mjs" 2>/dev/null || true
        sleep 1
    fi

    log_info "✓ 服务已停止"
}

# 重启服务
restart_service() {
    log_step "重启前端服务..."
    stop_service
    sleep 1
    start_service
}

# 显示状态
show_status() {
    echo ""
    echo "======================================"
    echo "前端服务状态"
    echo "======================================"
    echo ""

    # 进程状态
    if is_running; then
        PID=$(pgrep -f "node.*server.mjs" | head -1)
        echo -e "进程状态: ${GREEN}✓ 运行中${NC} (PID: $PID)"
    else
        echo -e "进程状态: ${RED}✗ 未运行${NC}"
    fi

    # 端口状态
    echo ""
    echo "端口状态:"
    if ss -tuln 2>/dev/null | grep -E ":5000\s" | grep -q LISTEN; then
        echo -e "  端口 5000: ${GREEN}✓ 已监听${NC}"
    else
        echo -e "  端口 5000: ${RED}✗ 未监听${NC}"
    fi

    # HTTP测试
    echo ""
    echo "HTTP 测试:"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null | grep -q "200"; then
        echo -e "  http://localhost:5000: ${GREEN}✓ 正常 (200 OK)${NC}"
    else
        echo -e "  http://localhost:5000: ${RED}✗ 无法访问${NC}"
    fi

    # 地图代理测试
    echo ""
    echo "地图代理测试:"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/map-service/pages/yunjing.html 2>/dev/null | grep -q "200"; then
        echo -e "  地图服务代理: ${GREEN}✓ 正常${NC}"
    else
        echo -e "  地图服务代理: ${RED}✗ 无法访问${NC}"
    fi

    echo ""
    echo "======================================"
}

# 查看日志
show_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        log_error "日志文件不存在: $LOG_FILE"
        exit 1
    fi

    log_info "显示日志（按Ctrl+C退出）..."
    tail -f "$LOG_FILE"
}

# 清理服务
clean_service() {
    log_step "清理服务..."

    stop_service

    # 清理日志
    if [ -f "$LOG_FILE" ]; then
        log_info "清空日志文件..."
        > "$LOG_FILE"
    fi

    log_info "✓ 清理完成"
}

# 显示帮助
show_help() {
    cat << EOF
服务管理脚本 - 手持察打一体设备前端服务

用法: $0 [command]

命令:
  start     启动前端服务
  stop      停止前端服务
  restart   重启前端服务
  status    查看服务状态
  logs      查看实时日志
  clean     停止服务并清理日志
  help      显示此帮助信息

示例:
  $0 start    # 启动服务
  $0 stop     # 停止服务
  $0 restart  # 重启服务
  $0 status   # 查看状态
  $0 logs     # 查看日志

服务信息:
  - 服务端口: 5000
  - 访问地址: http://localhost:5000
  - 日志文件: $LOG_FILE

EOF
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        clean)
            clean_service
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
}

main "$@"
