#!/bin/bash
# 启动静态文件服务器的脚本（修复版）
# 避免 "can only join an iterable" 错误

set -e  # 遇到错误立即退出

echo "======================================"
echo "开始启动静态文件服务器..."
echo "======================================"

# 进入frontend目录
cd /workspace/projects/frontend

# 查找并杀掉已存在的node server.mjs进程
echo "[1/5] 检查现有进程..."
OLD_PID=$(ps aux | grep "[n]ode server.mjs" | awk '{print $2}' || true)

if [ ! -z "$OLD_PID" ]; then
    echo "发现已运行的服务进程 (PID: $OLD_PID)，正在停止..."
    kill -15 $OLD_PID 2>/dev/null || kill -9 $OLD_PID 2>/dev/null || true
    sleep 2
else
    echo "没有发现运行中的进程"
fi

# 检查端口是否被占用
echo "[2/5] 检查端口 5000..."
if ss -tuln 2>/dev/null | grep -q ":5000.*LISTEN"; then
    echo "警告：端口 5000 仍被占用，尝试强制释放..."
    # 查找占用5000端口的进程并杀掉
    PORT_PID=$(ss -lptn 'sport = :5000' 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 || true)
    if [ ! -z "$PORT_PID" ]; then
        echo "强制杀掉进程 $PORT_PID"
        kill -9 $PORT_PID 2>/dev/null || true
        sleep 1
    fi
else
    echo "端口 5000 空闲"
fi

# 检查必要文件
echo "[3/5] 检查必要文件..."
if [ ! -f "server.mjs" ]; then
    echo "错误: server.mjs 不存在"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "错误: dist/index.html 不存在，请先运行 pnpm run build"
    exit 1
fi
echo "所有必要文件存在"

# 确保日志目录存在
echo "[4/5] 准备日志..."
mkdir -p /app/work/logs/bypass

# 清空或创建日志文件
: > /app/work/logs/bypass/dev.log

# 启动服务（使用 nohup 确保后台运行）
echo "[5/5] 启动服务中..."
nohup node server.mjs >> /app/work/logs/bypass/dev.log 2>&1 &
NEW_PID=$!

echo "服务进程ID: $NEW_PID"

# 等待服务启动
echo "等待服务启动（5秒）..."
sleep 5

# 检查进程是否还在运行
if ! kill -0 $NEW_PID 2>/dev/null; then
    echo "======================================"
    echo "✗ 服务启动失败！进程已退出"
    echo "======================================"
    echo ""
    echo "错误日志："
    echo "--------------------------------------"
    cat /app/work/logs/bypass/dev.log
    echo "--------------------------------------"
    exit 1
fi

# 检查端口是否监听（使用多种方法）
PORT_STATUS=""
PORT_STATUS=$(ss -tuln 2>/dev/null | grep ":5000.*LISTEN" || true)
if [ -z "$PORT_STATUS" ]; then
    # 尝试使用 lsof
    PORT_STATUS=$(lsof -i:5000 2>/dev/null | grep LISTEN || true)
fi

if [ -z "$PORT_STATUS" ]; then
    # 再次等待并重试
    sleep 2
    PORT_STATUS=$(ss -tuln 2>/dev/null | grep ":5000.*LISTEN" || true)
fi

if [ -z "$PORT_STATUS" ]; then
    echo "======================================"
    echo "✗ 服务启动失败！端口 5000 未监听"
    echo "======================================"
    echo ""
    echo "日志内容："
    echo "--------------------------------------"
    cat /app/work/logs/bypass/dev.log
    echo "--------------------------------------"
    echo ""
    echo "进程状态："
    ps aux | grep "[n]ode server.mjs" || echo "进程不存在"
    echo "--------------------------------------"
    exit 1
fi

# 服务启动成功
echo "======================================"
echo "✓ 服务启动成功！"
echo "======================================"
echo "✓ 进程ID: $NEW_PID"
echo "✓ 访问地址: http://localhost:5000"
echo "✓ 日志文件: /app/work/logs/bypass/dev.log"
echo "======================================"
echo ""
echo "最近的日志："
echo "--------------------------------------"
tail -n 10 /app/work/logs/bypass/dev.log
echo "--------------------------------------"
