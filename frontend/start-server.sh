#!/bin/bash
# 启动静态文件服务器的脚本

echo "开始启动静态文件服务器..."

# 进入frontend目录
cd /workspace/projects/frontend

# 查找并杀掉已存在的node server.mjs进程
OLD_PID=$(ps aux | grep "node server.mjs" | grep -v grep | awk '{print $2}')

if [ ! -z "$OLD_PID" ]; then
    echo "发现已运行的服务进程 (PID: $OLD_PID)，正在停止..."
    kill -9 $OLD_PID 2>/dev/null
    sleep 2
fi

# 检查端口是否被占用
if ss -tuln 2>/dev/null | grep -q ":5000.*LISTEN"; then
    echo "警告：端口 5000 仍被占用，尝试强制释放..."
    # 查找占用5000端口的进程并杀掉
    PORT_PID=$(ss -lptn 'sport = :5000' 2>/dev/null | tail -1 | awk -F'[=,]' '{print $4}')
    if [ ! -z "$PORT_PID" ]; then
        kill -9 $PORT_PID 2>/dev/null
        sleep 1
    fi
fi

# 清空日志文件
echo "" > /app/work/logs/bypass/dev.log

# 启动服务
echo "启动服务中..."
node server.mjs > /app/work/logs/bypass/dev.log 2>&1 &
NEW_PID=$!

# 等待服务启动
sleep 3

# 检查服务是否成功启动
PORT_STATUS=$(ss -tuln 2>/dev/null | grep ":5000")
if [ ! -z "$PORT_STATUS" ]; then
    echo "✓ 服务启动成功！"
    echo "✓ 进程ID: $NEW_PID"
    echo "✓ 访问地址: http://localhost:5000"
    echo ""
    echo "最近的日志："
    tail -n 10 /app/work/logs/bypass/dev.log
else
    echo "✗ 服务启动失败！"
    echo ""
    echo "错误日志："
    tail -n 20 /app/work/logs/bypass/dev.log
    exit 1
fi
