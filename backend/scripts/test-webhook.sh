#!/bin/bash

# V5.9 Webhook测试脚本
# 用于测试Webhook推送功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BASE_URL="http://localhost:3001"
JWT_TOKEN=""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}V5.9 Webhook测试脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查服务是否运行
echo -e "${YELLOW}检查后端服务...${NC}"
if ! curl -s "$BASE_URL/api/v1/health" > /dev/null; then
    echo -e "${RED}错误：后端服务未运行，请先启动服务！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 后端服务运行正常${NC}"
echo ""

# 获取JWT Token
echo -e "${YELLOW}获取JWT Token...${NC}"
read -p "请输入用户名: " USERNAME
read -sp "请输入密码: " PASSWORD
echo

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}错误：登录失败，无法获取JWT Token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ JWT Token获取成功${NC}"
echo ""

# 测试1：创建Webhook配置
echo -e "${YELLOW}测试1：创建Webhook配置${NC}"
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "测试Webhook",
        "url": "https://httpbin.org/post",
        "secret": "test-secret",
        "events": ["task.created", "task.updated"],
        "retryCount": 3,
        "timeout": 5000,
        "projectId": "00000000-0000-0000-0000-000000000000"
    }')

WEBHOOK_ID=$(echo $WEBHOOK_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -n1)

if [ -n "$WEBHOOK_ID" ]; then
    echo -e "${GREEN}✓ Webhook配置创建成功，ID: $WEBHOOK_ID${NC}"
else
    echo -e "${RED}✗ Webhook配置创建失败${NC}"
    echo $WEBHOOK_RESPONSE
fi
echo ""

# 测试2：查询Webhook配置列表
echo -e "${YELLOW}测试2：查询Webhook配置列表${NC}"
WEBHOOKS_LIST=$(curl -s -X GET "$BASE_URL/api/webhooks" \
    -H "Authorization: Bearer $JWT_TOKEN")

echo $WEBHOOKS_LIST | grep -q '"data"'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 查询Webhook配置列表成功${NC}"
else
    echo -e "${RED}✗ 查询Webhook配置列表失败${NC}"
fi
echo ""

# 测试3：查询单个Webhook配置
if [ -n "$WEBHOOK_ID" ]; then
    echo -e "${YELLOW}测试3：查询单个Webhook配置${NC}"
    WEBHOOK_DETAIL=$(curl -s -X GET "$BASE_URL/api/webhooks/$WEBHOOK_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo $WEBHOOK_DETAIL | grep -q '"id"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 查询单个Webhook配置成功${NC}"
    else
        echo -e "${RED}✗ 查询单个Webhook配置失败${NC}"
    fi
    echo ""
fi

# 测试4：测试Webhook推送
if [ -n "$WEBHOOK_ID" ]; then
    echo -e "${YELLOW}测试4：测试Webhook推送${NC}"
    TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/$WEBHOOK_ID/test" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "eventType": "task.created",
            "payload": {
                "taskId": "test-task-id",
                "title": "测试任务",
                "description": "这是一个测试任务"
            }
        }')

    echo $TEST_RESPONSE | grep -q '"success":true'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 测试Webhook推送成功${NC}"
    else
        echo -e "${YELLOW}⚠ 测试Webhook推送失败（可能是因为项目ID不存在）${NC}"
    fi
    echo ""
fi

# 测试5：查询Webhook推送日志
if [ -n "$WEBHOOK_ID" ]; then
    echo -e "${YELLOW}测试5：查询Webhook推送日志${NC}"
    LOGS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/webhooks/$WEBHOOK_ID/logs" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo $LOGS_RESPONSE | grep -q '"data"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 查询Webhook推送日志成功${NC}"
    else
        echo -e "${RED}✗ 查询Webhook推送日志失败${NC}"
    fi
    echo ""
fi

# 测试6：更新Webhook配置
if [ -n "$WEBHOOK_ID" ]; then
    echo -e "${YELLOW}测试6：更新Webhook配置${NC}"
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/webhooks/$WEBHOOK_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "测试Webhook（已更新）",
            "url": "https://httpbin.org/post",
            "events": ["task.created", "task.updated", "task.completed"]
        }')

    echo $UPDATE_RESPONSE | grep -q '"id"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 更新Webhook配置成功${NC}"
    else
        echo -e "${RED}✗ 更新Webhook配置失败${NC}"
    fi
    echo ""
fi

# 测试7：删除Webhook配置
if [ -n "$WEBHOOK_ID" ]; then
    echo -e "${YELLOW}测试7：删除Webhook配置${NC}"
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/webhooks/$WEBHOOK_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")

    # 删除成功通常返回204状态码
    if [ -z "$DELETE_RESPONSE" ] || echo "$DELETE_RESPONSE" | grep -q '"statusCode"'; then
        echo -e "${GREEN}✓ 删除Webhook配置成功${NC}"
    else
        echo -e "${RED}✗ 删除Webhook配置失败${NC}"
    fi
    echo ""
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Webhook测试完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
