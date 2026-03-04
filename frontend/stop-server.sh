#!/bin/bash
# 停止静态文件服务器的脚本

echo "停止静态文件服务器..."

# 查找并杀掉node server.mjs进程
PID=$(ps aux | grep "node server.mjs" | grep -v grep | awk '{print $2}')

if [ ! -z "$PID" ]; then
    echo "发现服务进程 (PID: $PID)，正在停止..."
    kill -9 $PID 2>/dev/null
    sleep 2

    # 检查进程是否被杀掉
    if ps -p $PID > /dev/null 2>&1; then
        echo "✗ 进程停止失败，尝试强制停止..."
        kill -9 $PID 2>/dev/null
        sleep 1
    else
        echo "✓ 进程已停止"
    fi
else
    echo "✓ 未发现运行中的服务"
fi

# 检查端口是否释放
if ss -tuln 2>/dev/null | grep -q ":5000.*LISTEN"; then
    echo "警告：端口 5000 仍被占用，尝试强制释放..."
    PORT_PID=$(ss -lptn 'sport = :5000' 2>/dev/null | tail -1 | awk -F'[=,]' '{print $4}')
    if [ ! -z "$PORT_PID" ]; then
        kill -9 $PORT_PID 2>/dev/null
        sleep 1
        echo "✓ 端口已释放"
    fi
else
    echo "✓ 端口 5000 已释放"
fi

echo "服务停止完成"
