# Agent Task System - API Documentation

## Overview

This document describes the REST API endpoints for the Agent Task Management System.

**Base URL**: `/api/v1`

**Authentication**: JWT Bearer Token (except health check endpoint)

---

## Endpoints

### Health Check

#### GET /api/v1/health

Health check endpoint (public, no authentication required).

**Response**:
```json
{
  "status": "success",
  "statusCode": 200,
  "data": {
    "status": "ok",
    "uptime": 300,
    "version": "3.0.0"
  }
}
```

---

## Task API

### 1. Create Task

#### POST /api/v1/tasks

Create a new task.

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Task title",
  "description": "Task description (optional)",
  "priority": "medium",
  "status": "pending",
  "dueDate": "2026-12-31T23:59:59Z (optional, ISO 8601 format)",
  "assigneeId": "user-uuid (optional)",
  "parentId": "parent-task-uuid (optional)",
  "progress": 0
}
```

**Important**: Use `dueDate` (not `deadline`) for task due dates. The field accepts ISO 8601 datetime format.

**Note**: The `progress` field is set to `0` by default upon task creation. To update progress after creation, use the dedicated endpoint `PATCH /api/v1/tasks/:id/progress`.

**Response** (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "task-uuid",
    "title": "Task title",
    "description": "Task description",
    "priority": "medium",
    "status": "pending",
    "progress": 0,
    "assigneeId": null,
    "created_at": "2026-03-04T10:00:00Z",
    "updated_at": "2026-03-04T10:00:00Z"
  }
}
```

---

### 2. List Tasks

#### GET /api/v1/tasks

Retrieve a list of tasks with optional filtering and pagination.

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, in_progress, completed, cancelled) |
| `priority` | string | Filter by priority (low, medium, high, urgent) |
| `assigneeId` | string | Filter by assignee ID |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "task-uuid",
      "title": "Task title",
      "description": "Task description",
      "priority": "medium",
      "status": "pending",
      "progress": 0,
      "assigneeId": null,
      "created_at": "2026-03-04T10:00:00Z",
      "updated_at": "2026-03-04T10:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### 3. Get Single Task

#### GET /api/v1/tasks/:id

Retrieve a single task by ID.

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task UUID |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "task-uuid",
    "title": "Task title",
    "description": "Task description",
    "priority": "medium",
    "status": "pending",
    "progress": 0,
    "assigneeId": null,
    "created_at": "2026-03-04T10:00:00Z",
    "updated_at": "2026-03-04T10:00:00Z"
  }
}
```

---

### 4. Update Task

#### PATCH /api/v1/tasks/:id

Update task properties (except progress).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task UUID |

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "high",
  "status": "in_progress",
  "assigneeId": "agent-uuid"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "task-uuid",
    "title": "Updated title",
    "description": "Updated description",
    "priority": "high",
    "status": "in_progress",
    "progress": 0,
    "assigneeId": "agent-uuid",
    "created_at": "2026-03-04T10:00:00Z",
    "updated_at": "2026-03-04T11:00:00Z"
  }
}
```

---

### 5. Update Task Progress (Dedicated Endpoint)

#### PATCH /api/v1/tasks/:id/progress

**Recommended**: Use this dedicated endpoint to update task progress.

This endpoint is specifically designed for updating the progress field of a task. The progress value represents the completion percentage of the task.

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task UUID |

**Request Body**:
```json
{
  "progress": 50
}
```

**Validation Rules**:
- `progress` must be an integer
- Minimum value: `0`
- Maximum value: `100`

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "task-uuid",
    "progress": 50,
    "updated_at": "2026-03-04T11:30:00Z"
  }
}
```

**Usage Examples**:

```bash
# Update progress to 25%
curl -X PATCH http://localhost:3001/api/v1/tasks/{task-id}/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress": 25}'

# Update progress to 100% (completed)
curl -X PATCH http://localhost:3001/api/v1/tasks/{task-id}/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress": 100}'
```

**Design Note**: 
- Task creation sets `progress` to `0` by default
- Use this dedicated endpoint to update progress after task creation
- This design separates progress tracking from general task updates for better control

---

### 6. Delete Task

#### DELETE /api/v1/tasks/:id

Delete a task by ID.

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Task UUID |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": null
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error details"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Task not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Data Types

### Task Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique task identifier |
| `title` | string | Task title |
| `description` | string | Task description |
| `priority` | string | Priority level: low, medium, high, urgent |
| `status` | string | Status: pending, in_progress, completed, cancelled |
| `progress` | number | Progress percentage: 0-100 |
| `assigneeId` | string (UUID) | Assigned user ID |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

---

## Performance

- Average API response time: **11.6ms** (target: <200ms)
- Performance verified: **17x faster than target**

---

## Version

- API Version: **v1**
- Service Version: **3.0.0**
- Last Updated: 2026-03-04
