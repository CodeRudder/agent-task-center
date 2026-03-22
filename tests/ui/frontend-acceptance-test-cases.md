# 前端页面功能验收用例（V5.5）

**文档版本**：v1.0  
**创建时间**：2026-03-21 13:13 GMT+8  
**创建人**：QA Engineer  
**验收环境**：PROD环境（http://localhost:5100）

---

## 📋 验收页面清单

1. **任务列表页（TaskListPage）** - 主页面，显示任务列表
2. **任务详情页（TaskDetailPage）** - 任务详情，包含投票和评论功能
3. **用户管理页（UserManagementPage）** - 用户列表和权限管理

---

## 📝 验收用例详情

### 1. 任务列表页（TaskListPage）

#### 1.1 任务列表显示

**用例ID**：TC-TASKLIST-001  
**测试目标**：验证任务列表能正确显示所有任务  
**前置条件**：用户已登录（使用 qa@prod.com / qa123）  

**测试步骤**：
1. 访问 http://localhost:5100/
2. 使用 qa@prod.com / qa123 登录
3. 等待页面加载完成
4. 检查任务列表是否显示
5. 检查任务卡片/行是否正确显示

**预期结果**：
- ✅ 任务列表成功加载
- ✅ 每个任务显示：标题、描述、状态、优先级、进度
- ✅ 任务按创建时间或更新时间排序
- ✅ 无JavaScript错误

**API验证**：
```bash
# 获取任务列表
curl -X GET http://localhost:5100/api/v1/tasks \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

---

#### 1.2 任务筛选和搜索

**用例ID**：TC-TASKLIST-002  
**测试目标**：验证任务筛选和搜索功能正常  
**前置条件**：任务列表页面已加载  

**测试步骤**：
1. 使用状态筛选器（status: pending, in_progress, completed, cancelled）
2. 使用优先级筛选器（priority: low, medium, high, urgent）
3. 使用搜索框输入关键词
4. 检查筛选结果是否正确

**预期结果**：
- ✅ 状态筛选正确
- ✅ 优先级筛选正确
- ✅ 搜索结果匹配关键词
- ✅ 筛选条件可以组合使用

**API验证**：
```bash
# 按状态筛选
curl -X GET "http://localhost:5100/api/v1/tasks?status=in_progress" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 按优先级筛选
curl -X GET "http://localhost:5100/api/v1/tasks?priority=high" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### 1.3 任务创建入口

**用例ID**：TC-TASKLIST-003  
**测试目标**：验证创建任务入口和功能正常  
**前置条件**：用户已登录  

**测试步骤**：
1. 点击"创建任务"按钮
2. 填写任务表单（标题、描述、优先级、状态）
3. 提交创建
4. 检查任务是否成功创建
5. 检查任务列表是否更新

**预期结果**：
- ✅ 创建任务按钮可见且可点击
- ✅ 表单验证正确（必填字段）
- ✅ 任务创建成功
- ✅ 新任务出现在列表中

**API验证**：
```bash
# 创建任务
curl -X POST http://localhost:5100/api/v1/tasks \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试任务",
    "description": "测试任务描述",
    "priority": "medium",
    "status": "pending",
    "progress": 0
  }'
```

---

### 2. 任务详情页（TaskDetailPage）

#### 2.1 任务详情显示

**用例ID**：TC-TASKDETAIL-001  
**测试目标**：验证任务详情页面能正确显示任务信息  
**前置条件**：已创建测试任务  

**测试步骤**：
1. 从任务列表点击某个任务
2. 等待详情页面加载
3. 检查任务详情是否完整显示
4. 检查所有字段是否正确

**预期结果**：
- ✅ 任务标题、描述正确显示
- ✅ 状态、优先级、进度正确显示
- ✅ 创建时间、更新时间正确显示
- ✅ 分配人员正确显示（如有）

**API验证**：
```bash
# 获取任务详情
curl -X GET "http://localhost:5100/api/v1/tasks/<TASK_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### 2.2 任务编辑功能

**用例ID**：TC-TASKDETAIL-002  
**测试目标**：验证任务编辑功能正常  
**前置条件**：已打开任务详情页面  

**测试步骤**：
1. 点击"编辑"按钮
2. 修改任务标题、描述或其他字段
3. 保存修改
4. 检查修改是否生效
5. 检查更新时间是否更新

**预期结果**：
- ✅ 编辑按钮可见且可点击
- ✅ 表单预填充当前任务数据
- ✅ 修改成功保存
- ✅ 详情页面显示更新后的数据
- ✅ 更新时间已更新

**API验证**：
```bash
# 更新任务
curl -X PATCH "http://localhost:5100/api/v1/tasks/<TASK_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的任务标题",
    "description": "更新后的任务描述",
    "priority": "high",
    "status": "in_progress"
  }'
```

---

#### 2.3 投票功能（V5.5新功能）

**用例ID**：TC-TASKDETAIL-003  
**测试目标**：验证投票功能正常工作  
**前置条件**：已打开任务详情页面  

**测试步骤**：
1. 查看任务详情页面的投票组件（VoteButtons + VoteStats）
2. 点击"赞成"按钮
3. 检查投票数是否增加
4. 点击"反对"按钮
5. 检查投票数是否更新
6. 刷新页面，验证投票是否保存

**预期结果**：
- ✅ 投票按钮可见且可点击
- ✅ 投票统计数据正确显示
- ✅ 点击投票后，统计数据立即更新
- ✅ 投票数据持久化保存
- ✅ 用户投票状态正确显示（已投票的按钮高亮或禁用）

**API验证**：
```bash
# 创建投票
curl -X POST http://localhost:5100/api/v1/votes \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 1
  }'

# 获取投票统计
curl -X GET "http://localhost:5100/api/v1/votes/stats?taskId=<TASK_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

#### 2.4 评论功能

**用例ID**：TC-TASKDETAIL-004  
**测试目标**：验证评论功能正常  
**前置条件**：已打开任务详情页面  

**测试步骤**：
1. 找到评论区
2. 输入评论文本
3. 提交评论
4. 检查评论是否显示
5. 回复评论（如有回复功能）

**预期结果**：
- ✅ 评论输入框可用
- ✅ 评论成功提交
- ✅ 评论正确显示在列表中
- ✅ 评论时间正确显示
- ✅ 可以回复评论

**API验证**：
```bash
# 创建评论
curl -X POST http://localhost:5100/api/v1/comments \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<TASK_ID>",
    "content": "这是一条测试评论"
  }'
```

---

### 3. 用户管理页（UserManagementPage）

#### 3.1 用户列表显示

**用例ID**：TC-USERMGMT-001  
**测试目标**：验证用户列表能正确显示  
**前置条件**：使用管理员账号登录（admin@prod.com / admin123）  

**测试步骤**：
1. 登录管理员账号
2. 访问用户管理页面
3. 等待页面加载
4. 检查用户列表是否显示

**预期结果**：
- ✅ 用户列表成功加载
- ✅ 每个用户显示：邮箱、姓名、角色、创建时间
- ✅ 分页功能正常（如有）

**API验证**：
```bash
# 获取用户列表（需要管理员权限）
curl -X GET http://localhost:5100/api/v1/users \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

---

#### 3.2 用户权限管理

**用例ID**：TC-USERMGMT-002  
**测试目标**：验证用户权限管理功能正常  
**前置条件**：已打开用户管理页面  

**测试步骤**：
1. 选择一个用户
2. 修改用户角色
3. 保存修改
4. 检查修改是否生效

**预期结果**：
- ✅ 可以修改用户角色
- ✅ 修改成功保存
- ✅ 用户权限立即生效

**API验证**：
```bash
# 更新用户角色（需要管理员权限）
curl -X PATCH "http://localhost:5100/api/v1/users/<USER_ID>" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "QA"
  }'
```

---

## 🔍 集成测试脚本

### 登录脚本

```bash
#!/bin/bash
# login-test.sh

echo "===== 测试登录API ====="
RESPONSE=$(curl -s -X POST http://localhost:5100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@prod.com","password":"qa123"}')

echo "$RESPONSE"

# 提取access token
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ "$ACCESS_TOKEN" != "" ]; then
  echo "✅ 登录成功"
  echo "Access Token: $ACCESS_TOKEN"
else
  echo "❌ 登录失败"
  exit 1
fi

# 保存token到文件
echo "$ACCESS_TOKEN" > /tmp/access_token.txt
```

### 任务CRUD测试脚本

```bash
#!/bin/bash
# task-crud-test.sh

ACCESS_TOKEN=$(cat /tmp/access_token.txt)

echo "===== 测试任务创建 ====="
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5100/api/v1/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "前端验收测试任务",
    "description": "这是一个前端验收测试任务",
    "priority": "high",
    "status": "pending",
    "progress": 0
  }')

echo "$CREATE_RESPONSE"
TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "Task ID: $TASK_ID"

echo ""
echo "===== 测试任务查询 ====="
curl -s -X GET http://localhost:5100/api/v1/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo ""
echo "===== 测试任务详情 ====="
curl -s -X GET "http://localhost:5100/api/v1/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo ""
echo "===== 测试任务更新 ====="
curl -s -X PATCH "http://localhost:5100/api/v1/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的任务标题",
    "status": "in_progress",
    "progress": 50
  }' | jq '.'

echo ""
echo "===== 测试任务进度更新 ====="
curl -s -X PATCH "http://localhost:5100/api/v1/tasks/$TASK_ID/progress" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress": 75}' | jq '.'

echo ""
echo "===== 测试任务删除 ====="
curl -s -X DELETE "http://localhost:5100/api/v1/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

### 投票功能测试脚本

```bash
#!/bin/bash
# vote-test.sh

ACCESS_TOKEN=$(cat /tmp/access_token.txt)

echo "===== 创建测试任务 ====="
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5100/api/v1/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "投票测试任务",
    "description": "用于测试投票功能",
    "priority": "medium",
    "status": "pending",
    "progress": 0
  }')

TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "Task ID: $TASK_ID"

echo ""
echo "===== 测试投票创建 ====="
VOTE_RESPONSE=$(curl -s -X POST http://localhost:5100/api/v1/votes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"value\": 1
  }")

echo "$VOTE_RESPONSE"

echo ""
echo "===== 测试投票统计 ====="
curl -s -X GET "http://localhost:5100/api/v1/votes/stats?taskId=$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo ""
echo "===== 清理测试数据 ====="
curl -s -X DELETE "http://localhost:5100/api/v1/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 📊 验收报告模板

### 测试执行摘要

- **测试日期**：2026-03-21
- **测试环境**：PROD环境（http://localhost:5100）
- **测试账号**：qa@prod.com / qa123
- **总用例数**：9
- **通过数**：待测试
- **失败数**：待测试
- **阻塞数**：待测试

### 详细测试结果

| 用例ID | 用例名称 | 测试结果 | 备注 |
|--------|----------|----------|------|
| TC-TASKLIST-001 | 任务列表显示 | 待测试 | |
| TC-TASKLIST-002 | 任务筛选和搜索 | 待测试 | |
| TC-TASKLIST-003 | 任务创建入口 | 待测试 | |
| TC-TASKDETAIL-001 | 任务详情显示 | 待测试 | |
| TC-TASKDETAIL-002 | 任务编辑功能 | 待测试 | |
| TC-TASKDETAIL-003 | 投票功能 | 待测试 | V5.5新功能 |
| TC-TASKDETAIL-004 | 评论功能 | 待测试 | |
| TC-USERMGMT-001 | 用户列表显示 | 待测试 | |
| TC-USERMGMT-002 | 用户权限管理 | 待测试 | |

### 发现的问题

| 问题ID | 严重程度 | 问题描述 | 页面 | 状态 |
|--------|----------|----------|------|------|
| - | - | - | - | - |

---

## 📝 备注

1. **浏览器自动化工具问题**：
   - agent-browser命令行工具卡住
   - browser内置工具超时
   - 建议：人工执行前端UI测试，或修复工具后重新测试

2. **DEV环境问题**：
   - DEV环境（3100）数据库未初始化
   - 已报告给Ops团队

3. **替代方案**：
   - 使用API测试验证后端功能
   - 手动执行前端UI测试
   - 或修复浏览器工具后重新测试

---

**文档结束**

_创建人：QA Engineer | 创建时间：2026-03-21 13:13_
