#!/bin/bash
# 启动后端服务

cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/backend

echo "停止现有服务..."
pkill -f "node.*dist/src/main.js" || true
sleep 2

echo "启动后端服务..."
nohup npm run start:dev > /tmp/backend-dev.log 2>&1 &

echo "等待服务启动..."
sleep 10

echo "检查服务状态..."
if pgrep -f "node.*dist/src/main.js" > /dev/null; then
    echo "✅ 后端服务已启动"
    echo "PID: $(pgrep -f 'node.*dist/src/main.js')"
    echo ""
    echo "最近的日志:"
    tail -20 /tmp/backend-dev.log
else
    echo "❌ 后端服务启动失败"
    echo "查看日志: tail -f /tmp/backend-dev.log"
fi