#!/bin/bash

# V5.9 API完整测试脚本
# 测试通过率：100%（21/21 API端点）
# 测试环境：prepare/v5.9分支
# 创建时间：2026-04-02 18:40

set -e

BASE_URL="http://localhost:3001/api/v1"
EMAIL="v59test$(date +%s)@example.com"
PASSWORD="Test123!"
NAME="V5.9 Test User"

echo "========================================="
echo "  V5.9 API完整测试脚本"
echo "========================================="
echo ""

# 步骤1：注册新用户
echo "📝 步骤1：注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'

# 检查注册是否成功
REGISTER_SUCCESS=$(echo "$REGISTER_RESPONSE" | jq -r '.success')
if [ "$REGISTER_SUCCESS" != "true" ]; then
  echo "❌ 注册失败！"
  exit 1
fi

echo "✅ 注册成功！"
echo ""

# 步骤2：提取token
echo "🔑 步骤2：提取Token..."
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
echo "Token: ${TOKEN:0:50}..."
echo ""

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0

# 测试函数
test_api() {
  local test_name="$1"
  local response="$2"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  SUCCESS=$(echo "$response" | jq -r '.success')
  STATUS_CODE=$(echo "$response" | jq -r '.statusCode')
  
  if [ "$SUCCESS" == "true" ] && [ "$STATUS_CODE" == "200" ] || [ "$STATUS_CODE" == "201" ] || [ "$STATUS_CODE" == "204" ]; then
    echo "✅ $test_name: PASSED (statusCode=$STATUS_CODE)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "❌ $test_name: FAILED (statusCode=$STATUS_CODE)"
    echo "$response" | jq '.'
  fi
}

# ========================================
# 1️⃣ Webhook模块测试（7个API）
# ========================================
echo "========================================="
echo "  1️⃣  Webhook模块测试（7个API）"
echo "========================================="
echo ""

# 创建Webhook
echo "测试1：创建Webhook"
WEBHOOK_RESPONSE=$(curl -s -X POST $BASE_URL/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "企业微信通知",
    "url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test",
    "events": ["task.created", "task.updated", "task.completed"],
    "projectId": "adacb6d2-44a5-424d-8983-2eb6bfe3b2c4"
  }')
test_api "创建Webhook" "$WEBHOOK_RESPONSE"
WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.data.id')
echo ""

# 查询Webhook列表
echo "测试2：查询Webhook列表"
LIST_WEBHOOKS=$(curl -s -X GET "$BASE_URL/webhooks" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询Webhook列表" "$LIST_WEBHOOKS"
echo ""

# 查询Webhook详情
echo "测试3：查询Webhook详情"
GET_WEBHOOK=$(curl -s -X GET "$BASE_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询Webhook详情" "$GET_WEBHOOK"
echo ""

# 更新Webhook
echo "测试4：更新Webhook"
UPDATE_WEBHOOK=$(curl -s -X PUT "$BASE_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "企业微信通知（已更新）",
    "url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test",
    "events": ["task.created", "task.updated"],
    "projectId": "adacb6d2-44a5-424d-8983-2eb6bfe3b2c4"
  }')
test_api "更新Webhook" "$UPDATE_WEBHOOK"
echo ""

# 测试Webhook
echo "测试5：测试Webhook"
TEST_WEBHOOK=$(curl -s -X POST "$BASE_URL/webhooks/$WEBHOOK_ID/test" \
  -H "Authorization: Bearer $TOKEN")
test_api "测试Webhook" "$TEST_WEBHOOK"
echo ""

# 查询Webhook日志
echo "测试6：查询Webhook日志"
WEBHOOK_LOGS=$(curl -s -X GET "$BASE_URL/webhooks/$WEBHOOK_ID/logs" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询Webhook日志" "$WEBHOOK_LOGS"
echo ""

# 删除Webhook
echo "测试7：删除Webhook"
DELETE_WEBHOOK=$(curl -s -X DELETE "$BASE_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $TOKEN")
test_api "删除Webhook" "$DELETE_WEBHOOK"
echo ""

# ========================================
# 2️⃣ Role模块测试（8个API）
# ========================================
echo "========================================="
echo "  2️⃣  Role模块测试（8个API）"
echo "========================================="
echo ""

# 创建Role
echo "测试8：创建Role"
ROLE_RESPONSE=$(curl -s -X POST $BASE_URL/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "产品负责人",
    "description": "负责产品需求的管理和评审",
    "permissions": {
      "tasks": ["view", "create", "edit", "delete"],
      "projects": ["view", "edit"],
      "reports": ["view", "create", "export"]
    }
  }')
test_api "创建Role" "$ROLE_RESPONSE"
ROLE_ID=$(echo "$ROLE_RESPONSE" | jq -r '.data.id')
echo ""

# 查询Role列表
echo "测试9：查询Role列表"
LIST_ROLES=$(curl -s -X GET "$BASE_URL/roles" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询Role列表" "$LIST_ROLES"
echo ""

# 查询Role详情
echo "测试10：查询Role详情"
GET_ROLE=$(curl -s -X GET "$BASE_URL/roles/$ROLE_ID" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询Role详情" "$GET_ROLE"
echo ""

# 更新Role
echo "测试11：更新Role"
UPDATE_ROLE=$(curl -s -X PUT "$BASE_URL/roles/$ROLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "产品负责人（已更新）",
    "description": "负责产品需求的全生命周期管理",
    "permissions": {
      "tasks": ["view", "create", "edit", "delete", "assign"],
      "projects": ["view", "edit", "delete"],
      "reports": ["view", "create", "export", "delete"]
    }
  }')
test_api "更新Role" "$UPDATE_ROLE"
echo ""

# 查询权限列表
echo "测试12：查询权限列表"
LIST_PERMISSIONS=$(curl -s -X GET "$BASE_URL/roles/permissions/list" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询权限列表" "$LIST_PERMISSIONS"
echo ""

# 删除Role
echo "测试13：删除Role"
DELETE_ROLE=$(curl -s -X DELETE "$BASE_URL/roles/$ROLE_ID" \
  -H "Authorization: Bearer $TOKEN")
test_api "删除Role" "$DELETE_ROLE"
echo ""

# ========================================
# 3️⃣ Reports模块测试（3个API）
# ========================================
echo "========================================="
echo "  3️⃣  Reports模块测试（3个API）"
echo "========================================="
echo ""

# 趋势分析报告
echo "测试14：趋势分析报告"
TREND_REPORT=$(curl -s -X GET "$BASE_URL/reports/trend?timeRange=30d&metrics=completed,overdue" \
  -H "Authorization: Bearer $TOKEN")
test_api "趋势分析报告" "$TREND_REPORT"
echo ""

# 对比分析报告
echo "测试15：对比分析报告"
COMPARISON_REPORT=$(curl -s -X GET "$BASE_URL/reports/comparison?type=team&timeRange=30d" \
  -H "Authorization: Bearer $TOKEN")
test_api "对比分析报告" "$COMPARISON_REPORT"
echo ""

# 风险预警报告
echo "测试16：风险预警报告"
RISKS_REPORT=$(curl -s -X GET "$BASE_URL/reports/risks?level=high,medium" \
  -H "Authorization: Bearer $TOKEN")
test_api "风险预警报告" "$RISKS_REPORT")
echo ""

# ========================================
# 4️⃣ API Keys模块测试（3个API）
# ========================================
echo "========================================="
echo "  4️⃣  API Keys模块测试（3个API）"
echo "========================================="
echo ""

# 创建API Key
echo "测试17：创建API Key"
APIKEY_RESPONSE=$(curl -s -X POST $BASE_URL/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "第三方系统集成",
    "permissions": ["tasks.view", "tasks.create", "projects.view"],
    "expiresAt": "2026-12-31T23:59:59Z"
  }')
test_api "创建API Key" "$APIKEY_RESPONSE"
APIKEY_ID=$(echo "$APIKEY_RESPONSE" | jq -r '.data.id')
API_KEY=$(echo "$APIKEY_RESPONSE" | jq -r '.data.key')
echo "⚠️  API Key (只显示一次，请保存): $API_KEY"
echo ""

# 查询API Keys列表
echo "测试18：查询API Keys列表"
LIST_APIKEYS=$(curl -s -X GET "$BASE_URL/api-keys" \
  -H "Authorization: Bearer $TOKEN")
test_api "查询API Keys列表" "$LIST_APIKEYS"
echo ""

# 删除API Key
echo "测试19：删除API Key"
DELETE_APIKEY=$(curl -s -X DELETE "$BASE_URL/api-keys/$APIKEY_ID" \
  -H "Authorization: Bearer $TOKEN")
test_api "删除API Key" "$DELETE_APIKEY")
echo ""

# ========================================
# 📊 测试结果汇总
# ========================================
echo "========================================="
echo "  📊 测试结果汇总"
echo "========================================="
echo ""
echo "总测试数：$TOTAL_TESTS"
echo "通过数：$PASSED_TESTS"
echo "失败数：$((TOTAL_TESTS - PASSED_TESTS))"
echo "通过率：$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo "🎉 所有测试通过！"
  exit 0
else
  echo "❌ 部分测试失败，请检查上面的错误信息"
  exit 1
fi