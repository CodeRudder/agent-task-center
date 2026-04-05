#!/bin/bash

# 测试Webhook修复效果（直接访问后端端口3002，绕过nginx）

echo "🧪 开始测试Webhook修复（直接访问后端）..."

# 测试登录获取token
echo ""
echo "🔑 步骤1: 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败，无法获取token"
  echo "登录响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功，token: ${TOKEN:0:30}..."

# 获取项目ID
echo ""
echo "📋 步骤2: 获取项目ID..."
PROJECTS_RESPONSE=$(curl -s -X GET http://localhost:3002/api/v1/projects \
  -H "Authorization: Bearer $TOKEN")

PROJECT_ID=$(echo $PROJECTS_RESPONSE | jq -r '.data.projects[0].id')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "❌ 获取项目ID失败"
  echo "项目响应: $PROJECTS_RESPONSE"
  exit 1
fi

echo "✅ 项目ID: $PROJECT_ID"

# 测试1: 创建Webhook
echo ""
echo "🧪 测试1: 创建Webhook..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"TestWebhook_$(date +%s)\",
    \"url\": \"https://example.com/webhook\",
    \"events\": [\"task.created\", \"task.updated\"],
    \"projectId\": \"$PROJECT_ID\"
  }")

echo "创建响应: $CREATE_RESPONSE"

SUCCESS=$(echo $CREATE_RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 测试1通过：创建Webhook成功"
  WEBHOOK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
  echo "Webhook ID: $WEBHOOK_ID"
else
  echo "❌ 测试1失败：创建Webhook失败"
  echo "错误: $(echo $CREATE_RESPONSE | jq -r '.message')"
  exit 1
fi

# 测试2: 测试Webhook（不传payload）
echo ""
echo "🧪 测试2: 测试Webhook发送（不传payload，验证@IsOptional()修复）..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "task.created"}')

echo "测试响应: $TEST_RESPONSE"

# 检查是否不再返回400错误
HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null -X POST http://localhost:3002/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "task.created"}')

if [ "$HTTP_CODE" != "400" ]; then
  echo "✅ 测试2通过：payload可选字段修复成功（HTTP状态码: $HTTP_CODE）"
else
  echo "❌ 测试2失败：仍然返回400错误（HTTP状态码: $HTTP_CODE）"
fi

# 测试3: 删除Webhook（检查返回格式）
echo ""
echo "🧪 测试3: 删除Webhook（检查返回格式统一性）..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3002/api/v1/webhooks/$WEBHOOK_ID \
  -H "Authorization: Bearer $TOKEN")

echo "删除响应: $DELETE_RESPONSE"

HAS_SUCCESS=$(echo $DELETE_RESPONSE | jq -r 'has("success")')
HAS_STATUS_CODE=$(echo $DELETE_RESPONSE | jq -r 'has("statusCode")')
HAS_MESSAGE=$(echo $DELETE_RESPONSE | jq -r 'has("message")')
HAS_DATA=$(echo $DELETE_RESPONSE | jq -r 'has("data")')

if [ "$HAS_SUCCESS" = "true" ] && [ "$HAS_STATUS_CODE" = "true" ] && [ "$HAS_MESSAGE" = "true" ] && [ "$HAS_DATA" = "true" ]; then
  echo "✅ 测试3通过：删除API返回格式统一"
  echo "  - success: $(echo $DELETE_RESPONSE | jq -r '.success')"
  echo "  - statusCode: $(echo $DELETE_RESPONSE | jq -r '.statusCode')"
  echo "  - message: $(echo $DELETE_RESPONSE | jq -r '.message')"
  echo "  - data: $(echo $DELETE_RESPONSE | jq -r '.data')"
else
  echo "❌ 测试3失败：删除API返回格式不统一"
  echo "  - has success: $HAS_SUCCESS"
  echo "  - has statusCode: $HAS_STATUS_CODE"
  echo "  - has message: $HAS_MESSAGE"
  echo "  - has data: $HAS_DATA"
fi

echo ""
echo "🎉 测试完成！"
