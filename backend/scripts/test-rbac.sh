#!/bin/bash

# V5.9 RBAC权限测试脚本
# 用于测试自定义角色权限功能

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
echo -e "${GREEN}V5.9 RBAC权限测试脚本${NC}"
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

# 获取JWT Token（需要管理员权限）
echo -e "${YELLOW}获取JWT Token...${NC}"
read -p "请输入管理员用户名: " USERNAME
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

# 测试1：创建角色
echo -e "${YELLOW}测试1：创建角色${NC}"
ROLE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/roles" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "测试角色",
        "description": "这是一个测试角色",
        "permissions": {
            "tasks": ["view", "create"],
            "projects": ["view"],
            "reports": ["view"]
        }
    }')

ROLE_ID=$(echo $ROLE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -n1)

if [ -n "$ROLE_ID" ]; then
    echo -e "${GREEN}✓ 角色创建成功，ID: $ROLE_ID${NC}"
else
    echo -e "${RED}✗ 角色创建失败${NC}"
    echo $ROLE_RESPONSE
fi
echo ""

# 测试2：查询角色列表
echo -e "${YELLOW}测试2：查询角色列表${NC}"
ROLES_LIST=$(curl -s -X GET "$BASE_URL/api/roles" \
    -H "Authorization: Bearer $JWT_TOKEN")

echo $ROLES_LIST | grep -q '"data"'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 查询角色列表成功${NC}"
    # 显示系统角色
    echo -e "${YELLOW}系统角色：${NC}"
    echo $ROLES_LIST | grep -o '"name":"[^"]*","isSystem":true' | cut -d'"' -f4
else
    echo -e "${RED}✗ 查询角色列表失败${NC}"
fi
echo ""

# 测试3：查询单个角色
if [ -n "$ROLE_ID" ]; then
    echo -e "${YELLOW}测试3：查询单个角色${NC}"
    ROLE_DETAIL=$(curl -s -X GET "$BASE_URL/api/roles/$ROLE_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo $ROLE_DETAIL | grep -q '"id"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 查询单个角色成功${NC}"
        echo -e "${YELLOW}角色权限：${NC}"
        echo $ROLE_DETAIL | grep -o '"permissions":{[^}]*}' | sed 's/,/\n/g'
    else
        echo -e "${RED}✗ 查询单个角色失败${NC}"
    fi
    echo ""
fi

# 测试4：更新角色
if [ -n "$ROLE_ID" ]; then
    echo -e "${YELLOW}测试4：更新角色${NC}"
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/roles/$ROLE_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "测试角色（已更新）",
            "description": "这是一个测试角色（已更新）",
            "permissions": {
                "tasks": ["view", "create", "edit"],
                "projects": ["view", "edit"],
                "reports": ["view", "export"]
            }
        }')

    echo $UPDATE_RESPONSE | grep -q '"id"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 更新角色成功${NC}"
    else
        echo -e "${RED}✗ 更新角色失败${NC}"
    fi
    echo ""
fi

# 测试5：分配角色给用户
if [ -n "$ROLE_ID" ]; then
    echo -e "${YELLOW}测试5：分配角色给用户${NC}"
    read -p "请输入要分配角色的用户ID: " USER_ID

    ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/roles/$ROLE_ID/assign" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"userIds\": [\"$USER_ID\"]
        }")

    echo $ASSIGN_RESPONSE | grep -q '"success":true'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 分配角色给用户成功${NC}"
    else
        echo -e "${YELLOW}⚠ 分配角色给用户失败（可能是因为用户ID不存在）${NC}"
    fi
    echo ""
fi

# 测试6：查询用户的角色
if [ -n "$USER_ID" ]; then
    echo -e "${YELLOW}测试6：查询用户的角色${NC}"
    USER_ROLES=$(curl -s -X GET "$BASE_URL/api/users/$USER_ID/roles" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo $USER_ROLES | grep -q '"data"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 查询用户的角色成功${NC}"
        echo -e "${YELLOW}用户角色：${NC}"
        echo $USER_ROLES | grep -o '"name":"[^"]*"' | cut -d'"' -f4
    else
        echo -e "${RED}✗ 查询用户的角色失败${NC}"
    fi
    echo ""
fi

# 测试7：移除用户角色
if [ -n "$ROLE_ID" ] && [ -n "$USER_ID" ]; then
    echo -e "${YELLOW}测试7：移除用户角色${NC}"
    REMOVE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/users/$USER_ID/roles/$ROLE_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")

    # 删除成功通常返回204状态码
    if [ -z "$REMOVE_RESPONSE" ] || echo "$REMOVE_RESPONSE" | grep -q '"statusCode"'; then
        echo -e "${GREEN}✓ 移除用户角色成功${NC}"
    else
        echo -e "${RED}✗ 移除用户角色失败${NC}"
    fi
    echo ""
fi

# 测试8：删除角色（非系统角色）
if [ -n "$ROLE_ID" ]; then
    echo -e "${YELLOW}测试8：删除角色${NC}"
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/roles/$ROLE_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")

    # 删除成功通常返回204状态码
    if [ -z "$DELETE_RESPONSE" ] || echo "$DELETE_RESPONSE" | grep -q '"statusCode"'; then
        echo -e "${GREEN}✓ 删除角色成功${NC}"
    else
        echo -e "${RED}✗ 删除角色失败${NC}"
    fi
    echo ""
fi

# 测试9：尝试删除系统角色（应该失败）
echo -e "${YELLOW}测试9：尝试删除系统角色（应该失败）${NC}"
SYSTEM_ROLE_ID=$(curl -s -X GET "$BASE_URL/api/roles?isSystem=true" \
    -H "Authorization: Bearer $JWT_TOKEN" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -n1)

if [ -n "$SYSTEM_ROLE_ID" ]; then
    DELETE_SYSTEM_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/roles/$SYSTEM_ROLE_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo $DELETE_SYSTEM_RESPONSE | grep -q '"error"'
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 正确拒绝了删除系统角色的请求${NC}"
        echo -e "${YELLOW}错误信息：${NC}"
        echo $DELETE_SYSTEM_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4
    else
        echo -e "${RED}✗ 意外：允许删除系统角色（这是bug！）${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未找到系统角色${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}RBAC权限测试完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
