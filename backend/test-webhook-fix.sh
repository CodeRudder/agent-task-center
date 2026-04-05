#!/bin/bash

# 测试Webhook修复效果

echo "🧪 开始测试Webhook修复..."

# 测试登录获取token
echo ""
echo "🔑 步骤1: 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"admin123"}')

echo "登录响应: $LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败，无法获取token"
  exit 1
fi

echo "✅ 登录成功，token: ${TOKEN:0:20}..."

# 获取项目ID
echo ""
echo "📋 步骤2: 获取项目ID..."
PROJECTS_RESPONSE=$(curl -s -X GET http://localhost:4100/api/v1/projects \
  -H "Authorization: Bearer $TOKEN")

echo "项目响应: $PROJECTS_RESPONSE" | jq '.'

PROJECT_ID=$(echo $PROJECTS_RESPONSE | jq -r '.data.projects[0].id')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "❌ 获取项目ID失败"
  exit 1
fi

echo "✅ 项目ID: $PROJECT_ID"

# 测试1: 创建Webhook
echo ""
echo "🧪 测试1: 创建Webhook..."
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
echo "🧪 测试2: 测试Webhook发送（不传payload，验证@IsOptional()修复）..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:4100/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "task.created"}')

echo "测试响应: $TEST_RESPONSE" | jq '.'

# 检查是否不再返回400错误
STATUS_CODE=$(echo $TEST_RESPONSE | jq -r '.statusCode // .status')
if [ "$STATUS_CODE" != "400" ]; then
  echo "✅ 测试2通过：payload可选字段修复成功（不再返回400）"
else
  echo "❌ 测试2失败：仍然返回400错误"
  echo "可能原因：payload字段验证仍然失败"
fi

# 测试3: 删除Webhook（检查返回格式）
echo ""
echo "🧪 测试3: 删除Webhook（检查返回格式统一性）..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:4100/api/v1/webhooks/$WEBHOOK_ID \
  -H "Authorization: Bearer $TOKEN")

echo "删除响应: $DELETE_RESPONSE" | jq '.'

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
echo ""
echo "📊 修复验证总结："
echo "1. TestWebhookDto.payload 可选字段：待验证（需要查看实际响应）"
echo "2. 删除API返回格式统一：待验证（需要查看实际响应）"
