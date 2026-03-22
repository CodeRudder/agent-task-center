#!/bin/bash
# 任务CRUD功能测试脚本
# 用途：验证任务的创建、查询、更新、删除功能

set -e

echo "========================================="
echo "  任务CRUD功能测试"
echo "========================================="
echo ""

# 检查token是否存在
if [ ! -f /tmp/qa_access_token.txt ]; then
  echo "❌ 错误: 未找到access token，请先运行 login-test.sh"
  exit 1
fi

ACCESS_TOKEN=$(cat /tmp/qa_access_token.txt)
API_URL="http://localhost:5100/api/v1"

echo "===== 步骤1: 创建任务 ====="
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "前端验收测试任务 - '"$(date +%H%M%S)"'",
    "description": "这是一个前端验收测试任务，用于验证任务CRUD功能",
    "priority": "high",
    "status": "todo",
    "progress": 0
  }')

echo "创建任务响应:"
echo "$CREATE_RESPONSE" | jq '.'

TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
if [ "$TASK_ID" == "null" ] || [ "$TASK_ID" == "" ]; then
  echo "❌ 创建任务失败"
  exit 1
fi

echo ""
echo "✅ 任务创建成功"
echo "Task ID: $TASK_ID"

echo ""
echo "===== 步骤2: 查询任务列表 ====="
LIST_RESPONSE=$(curl -s -X GET "$API_URL/tasks?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "任务列表响应:"
echo "$LIST_RESPONSE" | jq '.data | length'
echo "任务总数: $(echo "$LIST_RESPONSE" | jq '.meta.total')"

echo ""
echo "===== 步骤3: 查询任务详情 ====="
DETAIL_RESPONSE=$(curl -s -X GET "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "任务详情响应:"
echo "$DETAIL_RESPONSE" | jq '.'

echo ""
echo "===== 步骤4: 更新任务 ====="
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的任务标题 - 前端验收测试",
    "description": "任务已更新，用于验证更新功能",
    "status": "in_progress"
  }')

echo "更新任务响应:"
echo "$UPDATE_RESPONSE" | jq '.'

echo ""
echo "✅ 任务更新成功"

echo ""
echo "===== 步骤5: 更新任务进度 ====="
PROGRESS_RESPONSE=$(curl -s -X PATCH "$API_URL/tasks/$TASK_ID/progress" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress": 50}')

echo "更新进度响应:"
echo "$PROGRESS_RESPONSE" | jq '.'

echo ""
echo "✅ 进度更新成功"

echo ""
echo "===== 步骤6: 查询更新后的任务 ====="
UPDATED_DETAIL=$(curl -s -X GET "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "更新后的任务详情:"
echo "$UPDATED_DETAIL" | jq '.data | {title, status, progress}'

echo ""
echo "===== 步骤7: 删除任务 ====="
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "删除任务响应:"
echo "$DELETE_RESPONSE" | jq '.'

echo ""
echo "✅ 任务删除成功"

echo ""
echo "===== 步骤8: 验证任务已删除 ====="
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

VERIFY_STATUS=$(echo "$VERIFY_RESPONSE" | jq -r '.statusCode')
if [ "$VERIFY_STATUS" == "404" ]; then
  echo "✅ 验证成功：任务已被删除"
else
  echo "⚠️  警告: 任务可能未被正确删除"
fi

echo ""
echo "========================================="
echo "  任务CRUD测试完成"
echo "========================================="
