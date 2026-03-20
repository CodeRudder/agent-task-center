#!/bin/bash

# 测试投票API
# 1. 登录获取token
# 2. 测试投票API

echo "=== Step 1: Login ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3102/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo "Login Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

echo ""
echo "=== Step 2: Test Vote APIs ==="

# 测试投票统计API
echo ""
echo "--- Test GET /api/v1/tasks/:id/votes ---"
curl -s -X GET "http://localhost:3102/api/v1/tasks/a9b0172a-88ed-4ea7-9f70-e184cd5d8155/votes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 测试当前用户投票API
echo ""
echo ""
echo "--- Test GET /api/v1/tasks/:id/votes/me ---"
curl -s -X GET "http://localhost:3102/api/v1/tasks/a9b0172a-88ed-4ea7-9f70-e184cd5d8155/votes/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 测试投票API
echo ""
echo ""
echo "--- Test POST /api/v1/tasks/:id/votes ---"
curl -s -X POST "http://localhost:3102/api/v1/tasks/a9b0172a-88ed-4ea7-9f70-e184cd5d8155/votes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voteType":"approve"}'

echo ""
echo ""
echo "=== Test Complete ==="
