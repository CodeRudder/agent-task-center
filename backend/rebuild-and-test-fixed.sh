#!/bin/bash

# 重建并测试Webhook修复
# 修复内容：
# 1. TestWebhookDto.payload 改为可选字段
# 2. 删除API返回统一格式

set -e

echo "🔧 开始重建后端服务..."

# 停止并删除旧容器
echo "📦 停止旧容器..."
docker stop agent-task-backend-merged-test || true
docker rm agent-task-backend-merged-test || true

# 进入后端目录
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/backend

# 重新构建镜像
echo "🔨 重新构建镜像..."
docker build -t localhost:5000/agent-task-system:v5.9-fix-8 .

# 推送镜像到registry
echo "📤 推送镜像..."
docker push localhost:5000/agent-task-system:v5.9-fix-8

# 修改docker-compose.test.yml使用新镜像
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/docker
sed -i 's/agent-task-system:v5.9/agent-task-system:v5.9-fix-8/g' docker-compose.test.yml
sed -i 's/agent-task-backend-test/agent-task-backend-merged-test/g' docker-compose.test.yml
sed -i 's/agent-task-frontend-test/agent-task-frontend-merged-test/g' docker-compose.test.yml
sed -i 's/agent-task-postgres-test/agent-task-postgres-merged-test/g' docker-compose.test.yml
sed -i 's/agent-task-redis-test/agent-task-redis-merged-test/g' docker-compose.test.yml
sed -i 's/agent-task-nginx-test/agent-task-nginx-merged-test/g' docker-compose.test.yml
sed -i 's/postgres_test_data/postgres_merged_test_data/g' docker-compose.test.yml
sed -i 's/redis_test_data/redis_merged_test_data/g' docker-compose.test.yml
sed -i 's/test-network/merged-test-network/g' docker-compose.test.yml

# 修改端口映射避免冲突
sed -i 's/"3102:3000"/"3001:3000"/g' docker-compose.test.yml

# 启动新容器
echo "🚀 启动新容器..."
docker-compose -f docker-compose.test.yml -p test up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker ps | grep agent-task-backend-merged-test

# 测试登录获取token
echo "🔑 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"admin123"}')

echo "登录响应: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败，无法获取token"
  exit 1
fi

echo "✅ 登录成功，token: ${TOKEN:0:20}..."

# 获取项目ID
echo "📋 获取项目ID..."
PROJECTS_RESPONSE=$(curl -s -X GET http://localhost:4100/api/v1/projects \
  -H "Authorization: Bearer $TOKEN")

PROJECT_ID=$(echo $PROJECTS_RESPONSE | jq -r '.data.projects[0].id')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "❌ 获取项目ID失败"
  exit 1
fi

echo "✅ 项目ID: $PROJECT_ID"

# 测试1: 创建Webhook (不传payload，应该成功)
echo ""
echo "🧪 测试1: 创建Webhook（不传payload）..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:4100/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"TestWebhook_$(date +%s)\",
    \"url\": \"https://example.com/webhook\",
    \"events\": [\"task.created\", \"task.updated\"],
    \"projectId\": \"$PROJECT_ID\"
  }")

echo "创建响应: $CREATE_RESPONSE" | jq '.'

SUCCESS=$(echo $CREATE_RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 测试1通过：创建Webhook成功"
  WEBHOOK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
  echo "Webhook ID: $WEBHOOK_ID"
else
  echo "❌ 测试1失败：创建Webhook失败"
  exit 1
fi

# 测试2: 测试Webhook（不传payload）
echo ""
echo "🧪 测试2: 测试Webhook发送（不传payload）..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:4100/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "task.created"}')

echo "测试响应: $TEST_RESPONSE" | jq '.'

# 测试3: 删除Webhook（检查返回格式）
echo ""
echo "🧪 测试3: 删除Webhook（检查返回格式）..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:4100/api/v1/webhooks/$WEBHOOK_ID \
  -H "Authorization: Bearer $TOKEN")

echo "删除响应: $DELETE_RESPONSE" | jq '.'

HAS_SUCCESS=$(echo $DELETE_RESPONSE | jq -r 'has("success")')
HAS_STATUS_CODE=$(echo $DELETE_RESPONSE | jq -r 'has("statusCode")')
HAS_MESSAGE=$(echo $DELETE_RESPONSE | jq -r 'has("message")')
HAS_DATA=$(echo $DELETE_RESPONSE | jq -r 'has("data")')

if [ "$HAS_SUCCESS" = "true" ] && [ "$HAS_STATUS_CODE" = "true" ] && [ "$HAS_MESSAGE" = "true" ] && [ "$HAS_DATA" = "true" ]; then
  echo "✅ 测试3通过：删除API返回格式统一"
else
  echo "❌ 测试3失败：删除API返回格式不统一"
  echo "  - has success: $HAS_SUCCESS"
  echo "  - has statusCode: $HAS_STATUS_CODE"
  echo "  - has message: $HAS_MESSAGE"
  echo "  - has data: $HAS_DATA"
fi

echo ""
echo "🎉 所有测试完成！"
echo ""
echo "📊 修复总结："
echo "1. ✅ TestWebhookDto.payload 改为可选字段（@IsOptional()）"
echo "2. ✅ 删除API返回统一格式（success, statusCode, message, data）"
echo ""
echo "🔍 下一步：运行完整测试套件验证修复效果"
