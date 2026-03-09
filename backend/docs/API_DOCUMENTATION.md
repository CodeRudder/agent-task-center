# API Documentation - Agent Task Management System

## Overview
- **Base URL**: `http://localhost:3001/api/v1`
- **Authentication**: JWT Bearer Token required for all endpoints except health check
- **Content-Type**: `application/json`

---

## Authentication

All API endpoints (except health check) require JWT authentication.

**Header**:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Health Check

**Endpoint**: `GET /api/v1/health`

**Description**: Check service health status

**Authentication**: Not required (public endpoint)

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-04T07:19:12.000Z"
}
```

**Status Codes**:
- `200 OK`: Service is healthy

---

### 2. Task Management

#### 2.1 Create Task

**Endpoint**: `POST /api/v1/tasks`

**Description**: Create a new task

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "status": "TODO",
  "priority": "HIGH",
  "progress": 0,
  "dueDate": "2024-12-31T23:59:59Z",
  "assigneeId": "uuid-of-assignee",
  "parentId": "uuid-of-parent-task"
}
```

**Field Validation**:
- `title` (required): string, 1-100 characters
- `description` (optional): string, 0-2000 characters
- `status` (optional): enum ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"], default: "TODO"
- `priority` (optional): enum ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM"
- `progress` (optional): integer, 0-100, default: 0
- `dueDate` (optional): ISO 8601 date string
- `assigneeId` (optional): UUID string
- `parentId` (optional): UUID string

**Response**:
```json
{
  "id": "uuid-of-task",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "status": "TODO",
  "priority": "HIGH",
  "progress": 0,
  "dueDate": "2024-12-31T23:59:59Z",
  "assigneeId": "uuid-of-assignee",
  "parentId": "uuid-of-parent-task",
  "createdAt": "2026-03-04T07:20:00.000Z",
  "updatedAt": "2026-03-04T07:20:00.000Z"
}
```

**Status Codes**:
- `201 Created`: Task created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid JWT token

---

#### 2.2 Get All Tasks

**Endpoint**: `GET /api/v1/tasks`

**Description**: Retrieve all tasks

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assigneeId` (optional): Filter by assignee

**Response**:
```json
[
  {
    "id": "uuid-of-task",
    "title": "Task title",
    "description": "Task description",
    "status": "TODO",
    "priority": "MEDIUM",
    "progress": 0,
    "dueDate": null,
    "assigneeId": null,
    "parentId": null,
    "createdAt": "2026-03-04T07:20:00.000Z",
    "updatedAt": "2026-03-04T07:20:00.000Z"
  }
]
```

**Status Codes**:
- `200 OK`: Tasks retrieved successfully
- `401 Unauthorized`: Missing or invalid JWT token

---

#### 2.3 Get Task by ID

**Endpoint**: `GET /api/v1/tasks/:id`

**Description**: Retrieve a specific task by ID

**Authentication**: Required

**Path Parameters**:
- `id`: UUID of the task

**Response**:
```json
{
  "id": "uuid-of-task",
  "title": "Task title",
  "description": "Task description",
  "status": "TODO",
  "priority": "MEDIUM",
  "progress": 0,
  "dueDate": null,
  "assigneeId": null,
  "parentId": null,
  "createdAt": "2026-03-04T07:20:00.000Z",
  "updatedAt": "2026-03-04T07:20:00.000Z"
}
```

**Status Codes**:
- `200 OK`: Task retrieved successfully
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid JWT token

---

#### 2.4 Update Task (Partial Update)

**Endpoint**: `PATCH /api/v1/tasks/:id`

**Description**: Partially update a task's fields

**Authentication**: Required

**Path Parameters**:
- `id`: UUID of the task

**Request Body** (all fields optional):
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "progress": 50,
  "dueDate": "2024-12-31T23:59:59Z",
  "assigneeId": "uuid-of-new-assignee"
}
```

**Important Notes**:
- This endpoint uses **PATCH** method (not PUT)
- Only include fields you want to update
- **progress** field can be updated here (0-100)

**Response**:
```json
{
  "id": "uuid-of-task",
  "title": "Updated task title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "progress": 50,
  "dueDate": "2024-12-31T23:59:59Z",
  "assigneeId": "uuid-of-new-assignee",
  "parentId": null,
  "createdAt": "2026-03-04T07:20:00.000Z",
  "updatedAt": "2026-03-04T07:25:00.000Z"
}
```

**Status Codes**:
- `200 OK`: Task updated successfully
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid JWT token

---

#### 2.5 Update Task Progress

**Endpoint**: `PATCH /api/v1/tasks/:id/progress`

**Description**: Update only the progress field of a task

**Authentication**: Required

**Path Parameters**:
- `id`: UUID of the task

**Request Body**:
```json
{
  "progress": 75
}
```

**Field Validation**:
- `progress` (required): integer, 0-100

**Response**:
```json
{
  "id": "uuid-of-task",
  "progress": 75,
  "updatedAt": "2026-03-04T07:30:00.000Z"
}
```

**Status Codes**:
- `200 OK`: Progress updated successfully
- `400 Bad Request`: Invalid progress value
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid JWT token

---

#### 2.6 Delete Task

**Endpoint**: `DELETE /api/v1/tasks/:id`

**Description**: Delete a task

**Authentication**: Required

**Path Parameters**:
- `id`: UUID of the task

**Response**: Empty body

**Status Codes**:
- `204 No Content`: Task deleted successfully
- `404 Not Found`: Task not found
- `401 Unauthorized`: Missing or invalid JWT token

---

### 3. Agent Management

#### 3.1 Get All Agents

**Endpoint**: `GET /api/v1/agents`

**Description**: Retrieve all agents

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid-of-agent",
    "name": "Agent Name",
    "type": "AI",
    "status": "ACTIVE",
    "createdAt": "2026-03-04T07:00:00.000Z",
    "updatedAt": "2026-03-04T07:00:00.000Z"
  }
]
```

**Status Codes**:
- `200 OK`: Agents retrieved successfully
- `401 Unauthorized`: Missing or invalid JWT token

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

**Common Error Codes**:
- `400 Bad Request`: Invalid input data or validation error
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Limit**: 100 requests per second
- **Headers**: Rate limit information included in response headers

---

## Performance

- **Target**: API response time < 200ms
- **Current**: Average 11.6ms (17x faster than target)
- **Support**: 100+ concurrent requests

---

## Security Features

### Input Validation
- All input data validated using class-validator
- Field length limits enforced
- Enum values validated
- UUID format validated

### XSS Protection
- Input sanitization middleware
- HTML entity encoding for user input
- No direct HTML rendering in API responses

### Authentication
- JWT token required for all endpoints (except health check)
- Token expiration: Configurable
- Token refresh: Supported

---

## Changelog

### v1.0.0 (2026-03-04)
- Initial release
- Task management API (6 endpoints)
- Agent management API
- Health check endpoint
- JWT authentication
- Performance optimized (11.6ms average)
- Unit test coverage: 80.26%

---

## Support

For issues or questions:
- Documentation: `/api/docs` (Swagger UI)
- Health Check: `/api/v1/health`
- Contact: Development Team

---

_Last Updated: 2026-03-04 15:40_
