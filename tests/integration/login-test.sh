#!/bin/bash
# 登录功能测试脚本
# 用途：验证登录API是否正常工作

set -e

echo "========================================="
echo "  登录功能测试"
echo "========================================="
echo ""

# 测试环境
API_URL="http://localhost:5100/api/v1"
TEST_EMAIL="qa@prod.com"
TEST_PASSWORD="qa123"

echo "测试环境: $API_URL"
echo "测试账号: $TEST_EMAIL"
echo ""

echo "===== 步骤1: 测试登录API ====="
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "响应:"
echo "$RESPONSE" | jq '.'

# 检查登录是否成功
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ 登录成功"
  
  # 提取token
  ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')
  REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.data.refreshToken')
  USER_ID=$(echo "$RESPONSE" | jq -r '.data.user.id')
  USER_ROLE=$(echo "$RESPONSE" | jq -r '.data.user.role')
  
  echo ""
  echo "用户信息:"
  echo "  - ID: $USER_ID"
  echo "  - 邮箱: $TEST_EMAIL"
  echo "  - 角色: $USER_ROLE"
  echo ""
  echo "Token信息:"
  echo "  - Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "  - Refresh Token: ${REFRESH_TOKEN:0:50}..."
  
  # 保存token到文件
  echo "$ACCESS_TOKEN" > /tmp/qa_access_token.txt
  echo "$REFRESH_TOKEN" > /tmp/qa_refresh_token.txt
  echo ""
  echo "✅ Token已保存到 /tmp/qa_access_token.txt"
else
  echo ""
  echo "❌ 登录失败"
  ERROR_MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
  echo "错误信息: $ERROR_MESSAGE"
  exit 1
fi

echo ""
echo "========================================="
echo "  登录测试完成"
echo "========================================="
