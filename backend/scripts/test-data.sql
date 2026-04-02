-- V5.9 测试数据
-- 用于测试Webhook推送功能和自定义角色权限功能

-- 注意：运行此脚本前，请确保：
-- 1. 数据库已创建
-- 2. V5.9迁移脚本已运行
-- 3. 修改测试数据中的UUID为实际的用户ID和项目ID

BEGIN;

-- ========================================
-- 1. 测试用户数据（如果不存在）
-- ========================================

-- 插入测试用户（如果不存在）
INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test@example.com',
    'testuser',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123456', -- 密码: password123
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. 测试项目数据
-- ========================================

-- 插入测试项目
INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'V5.9测试项目',
    '用于测试V5.9功能的测试项目',
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. 测试角色数据
-- ========================================

-- 插入测试角色
INSERT INTO roles (id, name, description, is_system, permissions, created_by, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '测试管理员',
    '用于测试的管理员角色',
    false,
    '{
        "tasks": ["view", "create", "edit", "delete", "manage"],
        "projects": ["view", "create", "edit", "delete", "manage"],
        "users": ["view", "create", "edit", "delete"],
        "webhooks": ["view", "create", "edit", "delete", "manage"],
        "roles": ["view", "create", "edit", "delete", "manage"],
        "reports": ["view", "create", "export"],
        "api": ["view", "create", "delete", "manage"]
    }'::jsonb,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 插入测试角色（产品负责人）
INSERT INTO roles (id, name, description, is_system, permissions, created_by, created_at, updated_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '产品负责人',
    '负责产品需求的管理和评审',
    false,
    '{
        "tasks": ["view", "create", "edit", "delete"],
        "projects": ["view", "edit"],
        "reports": ["view", "create", "export"]
    }'::jsonb,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 插入测试角色（开发人员）
INSERT INTO roles (id, name, description, is_system, permissions, created_by, created_at, updated_at)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '开发人员',
    '负责功能开发和实现',
    false,
    '{
        "tasks": ["view", "create", "edit"],
        "projects": ["view"],
        "reports": ["view"]
    }'::jsonb,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 4. 测试用户角色关联数据
-- ========================================

-- 分配测试管理员角色给测试用户
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    NOW()
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ========================================
-- 5. 测试Webhook配置数据
-- ========================================

-- 插入测试Webhook配置（企业微信）
INSERT INTO webhook_configurations (
    id,
    name,
    url,
    secret,
    events,
    headers,
    template,
    is_active,
    retry_count,
    timeout,
    project_id,
    created_by,
    created_at,
    updated_at
)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '企业微信通知',
    'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test',
    'test-secret-key',
    '["task.created", "task.updated", "task.completed"]'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    '{
        "msgtype": "text",
        "text": {
            "content": "任务{{task.title}}已{{event.type}}"
        }
    }'::jsonb,
    true,
    3,
    5000,
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 插入测试Webhook配置（钉钉）
INSERT INTO webhook_configurations (
    id,
    name,
    url,
    secret,
    events,
    headers,
    template,
    is_active,
    retry_count,
    timeout,
    project_id,
    created_by,
    created_at,
    updated_at
)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    '钉钉通知',
    'https://oapi.dingtalk.com/robot/send?access_token=test',
    'test-secret-key-dingtalk',
    '["task.created", "task.updated", "task.completed", "task.deleted"]'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    '{
        "msgtype": "text",
        "text": {
            "content": "任务通知：{{task.title}}"
        }
    }'::jsonb,
    true,
    3,
    5000,
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 插入测试Webhook配置（httpbin测试）
INSERT INTO webhook_configurations (
    id,
    name,
    url,
    secret,
    events,
    headers,
    template,
    is_active,
    retry_count,
    timeout,
    project_id,
    created_by,
    created_at,
    updated_at
)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    'httpbin测试',
    'https://httpbin.org/post',
    'test-secret-httpbin',
    '["task.created", "task.updated"]'::jsonb,
    '{"Content-Type": "application/json"}'::jsonb,
    '{
        "task_id": "{{task.id}}",
        "title": "{{task.title}}",
        "event": "{{event.type}}"
    }'::jsonb,
    true,
    3,
    5000,
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 6. 测试Webhook日志数据
-- ========================================

-- 插入测试Webhook推送日志
INSERT INTO webhook_logs (
    id,
    webhook_id,
    event_type,
    payload,
    response_code,
    response_body,
    status,
    attempt,
    error_message,
    executed_at
)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '66666666-6666-6666-6666-666666666666',
    'task.created',
    '{
        "task_id": "test-task-001",
        "title": "测试任务",
        "description": "这是一个测试任务",
        "event": "task.created"
    }'::jsonb,
    200,
    '{"errcode": 0, "errmsg": "ok"}',
    'success',
    1,
    NULL,
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 插入测试Webhook推送日志（失败）
INSERT INTO webhook_logs (
    id,
    webhook_id,
    event_type,
    payload,
    response_code,
    response_body,
    status,
    attempt,
    error_message,
    executed_at
)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '66666666-6666-6666-6666-666666666666',
    'task.updated',
    '{
        "task_id": "test-task-002",
        "title": "测试任务2",
        "event": "task.updated"
    }'::jsonb,
    500,
    '{"errcode": 93000, "errmsg": "internal error"}',
    'failed',
    3,
    'Internal server error',
    NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. 测试API密钥数据
-- ========================================

-- 插入测试API密钥
INSERT INTO api_keys (
    id,
    name,
    key_hash,
    key_prefix,
    permissions,
    is_active,
    expires_at,
    created_by,
    created_at
)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '第三方系统集成',
    '$2b$10$abcdefghijklmnopqrstuvwxyz123456', -- Hash后的密钥
    'sk_live_test',
    '["tasks.view", "tasks.create", "projects.view"]'::jsonb,
    true,
    NOW() + INTERVAL '1 year',
    '11111111-1111-1111-1111-111111111111',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 提交事务
-- ========================================

COMMIT;

-- ========================================
-- 验证测试数据
-- ========================================

-- 验证测试用户
SELECT '测试用户:' AS info, id, email, username FROM users WHERE email = 'test@example.com';

-- 验证测试项目
SELECT '测试项目:' AS info, id, name FROM projects WHERE name = 'V5.9测试项目';

-- 验证测试角色
SELECT '测试角色:' AS info, id, name, is_system FROM roles WHERE name IN ('测试管理员', '产品负责人', '开发人员');

-- 验证测试Webhook配置
SELECT '测试Webhook配置:' AS info, id, name, is_active FROM webhook_configurations WHERE project_id = '22222222-2222-2222-2222-222222222222';

-- 验证测试Webhook日志
SELECT '测试Webhook日志:' AS info, id, event_type, status FROM webhook_logs WHERE webhook_id = '66666666-6666-6666-6666-666666666666';

-- 验证测试API密钥
SELECT '测试API密钥:' AS info, id, name, is_active FROM api_keys WHERE name = '第三方系统集成';

-- ========================================
-- 使用说明
-- ========================================

/*
测试账号信息：
- 用户名: test@example.com
- 密码: password123

测试项目ID：22222222-2222-2222-2222-222222222222

测试角色：
- 测试管理员（ID: 33333333-3333-3333-3333-333333333333）
- 产品负责人（ID: 44444444-4444-4444-4444-444444444444）
- 开发人员（ID: 55555555-5555-5555-5555-555555555555）

测试Webhook配置：
- 企业微信通知（ID: 66666666-6666-6666-6666-666666666666）
- 钉钉通知（ID: 77777777-7777-7777-7777-777777777777）
- httpbin测试（ID: 88888888-8888-8888-8888-888888888888）

测试API密钥：
- 第三方系统集成（ID: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb）
*/
