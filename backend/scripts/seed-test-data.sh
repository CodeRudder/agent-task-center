#!/bin/bash

# 测试数据准备脚本
# 用途：为QA验收测试环境准备测试数据

echo "================================"
echo "测试数据准备脚本"
echo "================================"

# 检查后端服务是否运行
echo "检查后端服务状态..."
if ! curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "⚠️  后端服务健康检查失败（/api/health不存在）"
    echo "继续执行数据准备..."
fi

# 使用API准备测试数据
echo ""
echo "开始准备测试数据..."

# 1. 登录获取token
echo "1. 登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ 登录失败，无法获取token"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ 登录成功，获取到token"

# 2. 创建标签
echo ""
echo "2. 创建标签（5个）..."
TAGS=("前端" "后端" "测试" "文档" "紧急")
TAG_COLORS=("#3B82F6" "#10B981" "#F59E0B" "#8B5CF6" "#EF4444")

for i in "${!TAGS[@]}"; do
    TAG="${TAGS[$i]}"
    COLOR="${TAG_COLORS[$i]}"
    
    echo "  创建标签: $TAG"
    curl -s -X POST http://localhost:3002/api/tags \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$TAG\",\"description\":\"$TAG相关\",\"color\":\"$COLOR\"}" > /dev/null
done

echo "✅ 标签创建完成"

# 3. 创建分类
echo ""
echo "3. 创建分类（3个）..."
CATEGORIES=("功能开发" "Bug修复" "性能优化")
CAT_COLORS=("#3B82F6" "#EF4444" "#10B981")

for i in "${!CATEGORIES[@]}"; do
    CAT="${CATEGORIES[$i]}"
    COLOR="${CAT_COLORS[$i]}"
    
    echo "  创建分类: $CAT"
    curl -s -X POST http://localhost:3002/api/categories \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$CAT\",\"description\":\"$CAT任务\",\"color\":\"$COLOR\"}" > /dev/null
done

echo "✅ 分类创建完成"

# 4. 创建任务
echo ""
echo "4. 创建测试任务（20个）..."

# 任务数据数组
declare -a TASKS=(
    "实现用户登录功能:实现基于JWT的用户登录功能:completed:high"
    "设计任务列表页面:设计并实现任务列表UI:in_progress:medium"
    "编写API文档:为所有API接口编写Swagger文档:pending:low"
    "实现任务过滤功能:支持按状态、优先级、负责人过滤任务:completed:high"
    "优化数据库查询:优化任务列表查询性能:in_progress:medium"
    "实现任务标签功能:支持为任务添加标签:pending:medium"
    "实现任务分类功能:支持为任务添加分类:pending:medium"
    "实现任务依赖关系:支持任务之间的依赖关系:in_progress:high"
    "编写单元测试:为核心模块编写单元测试:pending:high"
    "实现报表统计功能:实现任务统计报表:pending:medium"
    "修复登录bug:修复特定场景下登录失败的问题:completed:high"
    "优化前端性能:优化前端页面加载速度:in_progress:medium"
    "实现权限管理:实现基于角色的权限管理:pending:high"
    "编写集成测试:为关键流程编写集成测试:pending:medium"
    "实现任务评论功能:支持为任务添加评论:in_progress:low"
    "优化UI交互:改善用户界面交互体验:pending:low"
    "实现任务模板:支持创建任务模板:pending:medium"
    "实现批量操作:支持批量删除、修改任务:pending:medium"
    "实现任务导出:支持导出任务到CSV:completed:low"
    "实现任务提醒:支持任务到期提醒:pending:high"
)

for TASK_DATA in "${TASKS[@]}"; do
    IFS=':' read -r TITLE DESC STATUS PRIORITY <<< "$TASK_DATA"
    
    echo "  创建任务: $TITLE"
    curl -s -X POST http://localhost:3002/api/tasks \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$TITLE\",\"description\":\"$DESC\",\"status\":\"$STATUS\",\"priority\":\"$PRIORITY\"}" > /dev/null
done

echo "✅ 任务创建完成"

# 5. 创建Agent
echo ""
echo "5. 创建测试Agent（5个）..."

echo "  创建Agent: 前端开发工程师"
curl -s -X POST http://localhost:3002/api/agents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"前端开发工程师","type":"developer","description":"前端开发专家","capabilities":["React","Vue","TypeScript"],"maxConcurrentTasks":5}' > /dev/null

echo "  创建Agent: 后端开发工程师"
curl -s -X POST http://localhost:3002/api/agents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"后端开发工程师","type":"developer","description":"后端开发专家","capabilities":["Node.js","Python","PostgreSQL"],"maxConcurrentTasks":5}' > /dev/null

echo "  创建Agent: UI/UX设计师"
curl -s -X POST http://localhost:3002/api/agents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"UI/UX设计师","type":"designer","description":"UI/UX设计专家","capabilities":["Figma","Sketch","Adobe XD"],"maxConcurrentTasks":3}' > /dev/null

echo "  创建Agent: 测试工程师"
curl -s -X POST http://localhost:3002/api/agents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"测试工程师","type":"qa","description":"测试专家","capabilities":["Jest","Cypress","Selenium"],"maxConcurrentTasks":5}' > /dev/null

echo "  创建Agent: DevOps工程师"
curl -s -X POST http://localhost:3002/api/agents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"DevOps工程师","type":"devops","description":"DevOps专家","capabilities":["Docker","Kubernetes","CI/CD"],"maxConcurrentTasks":5}' > /dev/null

echo "✅ Agent创建完成"

# 6. 创建Project
echo ""
echo "6. 创建测试Project（3个）..."

echo "  创建Project: 任务管理系统"
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/projects \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"任务管理系统","description":"企业级任务管理平台","status":"active"}')

PROJECT1_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id' 2>/dev/null)

echo "  创建Project: 移动应用开发"
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/projects \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"移动应用开发","description":"iOS和Android应用开发","status":"active"}')

PROJECT2_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id' 2>/dev/null)

echo "  创建Project: 数据分析平台"
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/projects \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"数据分析平台","description":"大数据可视化分析平台","status":"active"}')

PROJECT3_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id' 2>/dev/null)

echo "✅ Project创建完成"

# 7. 创建Webhook
echo ""
echo "7. 创建测试Webhook（3个）..."

if [ -n "$PROJECT1_ID" ] && [ "$PROJECT1_ID" != "null" ]; then
    echo "  创建Webhook: 任务创建通知"
    curl -s -X POST http://localhost:3002/api/webhooks \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"任务创建通知\",\"url\":\"https://example.com/webhook/task-created\",\"secret\":\"task-secret-123\",\"events\":[\"task.created\"],\"projectId\":\"$PROJECT1_ID\",\"isActive\":true}" > /dev/null

    echo "  创建Webhook: 任务更新通知"
    curl -s -X POST http://localhost:3002/api/webhooks \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"任务更新通知\",\"url\":\"https://example.com/webhook/task-updated\",\"secret\":\"update-secret-456\",\"events\":[\"task.updated\"],\"projectId\":\"$PROJECT1_ID\",\"isActive\":true}" > /dev/null
fi

if [ -n "$PROJECT2_ID" ] && [ "$PROJECT2_ID" != "null" ]; then
    echo "  创建Webhook: 项目完成通知"
    curl -s -X POST http://localhost:3002/api/webhooks \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"项目完成通知\",\"url\":\"https://example.com/webhook/project-completed\",\"secret\":\"project-secret-789\",\"events\":[\"project.completed\"],\"projectId\":\"$PROJECT2_ID\",\"isActive\":true}" > /dev/null
fi

echo "✅ Webhook创建完成"

# 8. 创建Role
echo ""
echo "8. 创建测试Role（3个）..."

echo "  创建Role: 管理员"
curl -s -X POST http://localhost:3002/api/roles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"管理员","description":"系统管理员，拥有所有权限","permissions":{"tasks":["view","create","edit","delete","manage"],"projects":["view","create","edit","delete","manage"],"users":["view","create","edit","delete","manage"],"webhooks":["view","create","edit","delete","manage"],"roles":["view","create","edit","delete","manage"],"reports":["view","create","export"],"api":["view","create","delete","manage"]}}' > /dev/null

echo "  创建Role: 开发者"
curl -s -X POST http://localhost:3002/api/roles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"开发者","description":"开发人员，可以管理任务和项目","permissions":{"tasks":["view","create","edit","delete"],"projects":["view","create","edit"],"reports":["view","create","export"]}}' > /dev/null

echo "  创建Role: 访客"
curl -s -X POST http://localhost:3002/api/roles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"访客","description":"访客角色，只有查看权限","permissions":{"tasks":["view"],"projects":["view"],"reports":["view"]}}' > /dev/null

echo "✅ Role创建完成"

echo ""
echo "================================"
echo "测试数据准备完成！"
echo "================================"
echo ""
echo "✅ 已创建："
echo "  - 5个标签（前端、后端、测试、文档、紧急）"
echo "  - 3个分类（功能开发、Bug修复、性能优化）"
echo "  - 20个任务（不同状态和优先级）"
echo "  - 5个Agent（不同类型和能力）"
echo "  - 3个Project（不同项目）"
echo "  - 3个Webhook（不同事件）"
echo "  - 3个Role（管理员、开发者、访客）"
echo ""
echo "✅ 测试数据准备完成，QA可以开始验收测试！"
