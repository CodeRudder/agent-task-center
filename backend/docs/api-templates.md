# 任务模板API文档

## 概述
任务模板API提供创建、查询、更新、删除和应用模板的功能。

## 基础URL
```
/api/v1/templates
```

## 认证
所有API端点需要JWT认证，请在请求头中添加：
```
Authorization: Bearer <your-jwt-token>
```

## API端点

### 1. 创建模板
**POST** `/api/v1/templates`

创建一个新的任务模板。

**请求体：**
```json
{
  "name": "Bug Fix Template",
  "description": "Template for bug fix tasks",
  "category": "development",
  "defaultPriority": "high",
  "defaultTitle": "Bug: {{description}}",
  "defaultDescription": "Steps to reproduce:\n1. ...\n2. ...",
  "defaultMetadata": {
    "environment": "production"
  },
  "tags": ["bug", "urgent"],
  "estimatedMinutes": 60,
  "isActive": true
}
```

**响应：** 201 Created
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Bug Fix Template",
  "description": "Template for bug fix tasks",
  "category": "development",
  "defaultPriority": "high",
  "defaultTitle": "Bug: {{description}}",
  "defaultDescription": "Steps to reproduce:\n1. ...\n2. ...",
  "defaultMetadata": {
    "environment": "production"
  },
  "tags": ["bug", "urgent"],
  "estimatedMinutes": 60,
  "usageCount": 0,
  "isActive": true,
  "createdById": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2026-03-05T12:00:00.000Z",
  "updatedAt": "2026-03-05T12:00:00.000Z"
}
```

### 2. 查询模板列表
**GET** `/api/v1/templates`

获取模板列表，支持分页和过滤。

**查询参数：**
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 10
- `category` (可选): 按类别过滤
- `isActive` (可选): 按激活状态过滤
- `keyword` (可选): 搜索关键词（在名称和描述中搜索）

**示例：**
```
GET /api/v1/templates?page=1&pageSize=10&category=development&isActive=true
```

**响应：** 200 OK
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Bug Fix Template",
      "description": "Template for bug fix tasks",
      "category": "development",
      "defaultPriority": "high",
      "usageCount": 5,
      "isActive": true,
      "createdAt": "2026-03-05T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 3. 获取模板详情
**GET** `/api/v1/templates/:id`

获取单个模板的详细信息。

**路径参数：**
- `id`: 模板UUID

**响应：** 200 OK
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Bug Fix Template",
  "description": "Template for bug fix tasks",
  "category": "development",
  "defaultPriority": "high",
  "defaultTitle": "Bug: {{description}}",
  "defaultDescription": "Steps to reproduce:\n1. ...\n2. ...",
  "defaultMetadata": {
    "environment": "production"
  },
  "tags": ["bug", "urgent"],
  "estimatedMinutes": 60,
  "usageCount": 5,
  "isActive": true,
  "createdById": "123e4567-e89b-12d3-a456-426614174001",
  "createdBy": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "John Doe"
  },
  "createdAt": "2026-03-05T12:00:00.000Z",
  "updatedAt": "2026-03-05T12:00:00.000Z"
}
```

**错误响应：** 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Template not found"
}
```

### 4. 更新模板
**PUT** `/api/v1/templates/:id`

更新现有模板。

**路径参数：**
- `id`: 模板UUID

**请求体：**
```json
{
  "name": "Updated Template Name",
  "description": "Updated description",
  "defaultPriority": "urgent",
  "isActive": false
}
```

**响应：** 200 OK
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Template Name",
  "description": "Updated description",
  "defaultPriority": "urgent",
  "isActive": false,
  "updatedAt": "2026-03-05T13:00:00.000Z"
}
```

**错误响应：** 404 Not Found

### 5. 删除模板
**DELETE** `/api/v1/templates/:id`

软删除模板（标记为已删除）。

**路径参数：**
- `id`: 模板UUID

**响应：** 200 OK
```json
{}
```

**错误响应：** 404 Not Found

### 6. 应用模板创建任务
**POST** `/api/v1/templates/:id/apply`

使用模板创建一个新任务。

**路径参数：**
- `id`: 模板UUID

**请求体：**
```json
{
  "title": "Custom Task Title",
  "description": "Custom task description",
  "assigneeId": "123e4567-e89b-12d3-a456-426614174002",
  "dueDate": "2026-03-10T00:00:00.000Z",
  "customMetadata": {
    "priority": "critical"
  }
}
```

**响应：** 201 Created
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "title": "Custom Task Title",
  "description": "Custom task description",
  "status": "todo",
  "priority": "high",
  "progress": 0,
  "assigneeId": "123e4567-e89b-12d3-a456-426614174002",
  "dueDate": "2026-03-10T00:00:00.000Z",
  "metadata": {
    "templateId": "123e4567-e89b-12d3-a456-426614174000",
    "templateName": "Bug Fix Template",
    "priority": "critical"
  },
  "templateId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-03-05T14:00:00.000Z"
}
```

**错误响应：**
- 404 Not Found: 模板不存在
- 400 Bad Request: 模板未激活
```json
{
  "statusCode": 400,
  "message": "Template is not active"
}
```

## 数据模型

### TemplateCategory (枚举)
- `development`: 开发
- `design`: 设计
- `marketing`: 营销
- `operations`: 运营
- `general`: 通用

### TaskPriority (枚举)
- `low`: 低
- `medium`: 中
- `high`: 高
- `urgent`: 紧急

### TaskTemplate (实体)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 模板唯一标识 |
| name | string | 模板名称 |
| description | string | 模板描述 |
| category | enum | 模板类别 |
| defaultPriority | enum | 默认优先级 |
| defaultTitle | string | 默认任务标题 |
| defaultDescription | string | 默认任务描述 |
| defaultMetadata | JSON | 默认元数据 |
| tags | string[] | 标签数组 |
| estimatedMinutes | number | 预估时长（分钟） |
| usageCount | number | 使用次数 |
| isActive | boolean | 是否激活 |
| createdById | UUID | 创建者ID |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |
| deletedAt | timestamp | 删除时间 |

## 错误处理

所有错误响应遵循以下格式：
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

常见错误码：
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 测试覆盖率

- Controller测试覆盖率: 100%
- Service测试覆盖率: 97.56%
- 单元测试总数: 20个
- 所有测试通过 ✅

## 更新日志

### v1.0.0 (2026-03-05)
- ✅ 实现所有6个API端点
- ✅ 数据库迁移文件创建
- ✅ 单元测试覆盖率 > 80%
- ✅ API文档完善
