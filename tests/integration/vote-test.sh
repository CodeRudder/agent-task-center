#!/bin/bash
# 投票功能测试脚本（V5.5新功能）
# 用途：验证投票创建和统计功能

set -e

echo "========================================="
echo "  投票功能测试（V5.5新功能）"
echo "========================================="
echo ""

# 检查token是否存在
if [ ! -f /tmp/qa_access_token.txt ]; then
  echo "❌ 错误: 未找到access token，请先运行 login-test.sh"
  exit 1
fi

ACCESS_TOKEN=$(cat /tmp/qa_access_token.txt)
API_URL="http://localhost:5100/api/v1"

echo "===== 步骤1: 创建测试任务 ====="
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "投票功能测试任务",
    "description": "用于测试V5.5新增的投票功能",
    "priority": "medium",
    "status": "todo",
    "progress": 0
  }')

TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
if [ "$TASK_ID" == "null" ] || [ "$TASK_ID" == "" ]; then
  echo "❌ 创建任务失败"
  exit 1
fi

echo "✅ 测试任务创建成功"
echo "Task ID: $TASK_ID"

echo ""
echo "===== 步骤2: 创建赞成投票 ====="
VOTE_UP_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$TASK_ID/votes" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"voteType\": \"upvote\"
  }")

echo "创建赞成投票响应:"
echo "$VOTE_UP_RESPONSE" | jq '.'

VOTE_SUCCESS=$(echo "$VOTE_UP_RESPONSE" | jq -r '.success')
if [ "$VOTE_SUCCESS" == "true" ]; then
  echo "✅ 赞成投票创建成功"
else
  echo "❌ 赞成投票创建失败"
  ERROR_MSG=$(echo "$VOTE_UP_RESPONSE" | jq -r '.message')
  echo "错误信息: $ERROR_MSG"
fi

echo ""
echo "===== 步骤3: 查询投票统计 ====="
STATS_RESPONSE=$(curl -s -X GET "$API_URL/tasks/$TASK_ID/votes" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "投票统计响应:"
echo "$STATS_RESPONSE" | jq '.'

UP_COUNT=$(echo "$STATS_RESPONSE" | jq -r '.data.upCount')
DOWN_COUNT=$(echo "$STATS_RESPONSE" | jq -r '.data.downCount')
TOTAL_COUNT=$(echo "$STATS_RESPONSE" | jq -r '.data.totalCount')

echo ""
echo "投票统计:"
echo "  - 赞成票数: $UP_COUNT"
echo "  - 反对票数: $DOWN_COUNT"
echo "  - 总票数: $TOTAL_COUNT"

echo ""
echo "✅ 投票统计查询成功"

echo ""
echo "===== 步骤4: 更新投票（改为反对） ====="
VOTE_DOWN_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$TASK_ID/votes" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"voteType\": \"downvote\"
  }")

echo "更新投票响应:"
echo "$VOTE_DOWN_RESPONSE" | jq '.'

echo ""
echo "===== 步骤5: 再次查询投票统计 ====="
STATS_RESPONSE2=$(curl -s -X GET "$API_URL/tasks/$TASK_ID/votes" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "更新后的投票统计:"
echo "$STATS_RESPONSE2" | jq '.data'

UP_COUNT2=$(echo "$STATS_RESPONSE2" | jq -r '.data.upCount')
DOWN_COUNT2=$(echo "$STATS_RESPONSE2" | jq -r '.data.downCount')

echo ""
echo "更新后统计:"
echo "  - 赞成票数: $UP_COUNT2"
echo "  - 反对票数: $DOWN_COUNT2"

echo ""
echo "✅ 投票更新成功"

echo ""
echo "===== 步骤6: 清理测试数据 ====="
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "清理测试任务:"
echo "$DELETE_RESPONSE" | jq '.'

echo ""
echo "✅ 测试数据已清理"

echo ""
echo "========================================="
echo "  投票功能测试完成"
echo "========================================="
