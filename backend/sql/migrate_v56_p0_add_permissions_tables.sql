-- ============================================================================
-- V5.6 P0 Migration Script: Add Permissions System and User Fields
-- ============================================================================
-- Purpose: Add RBAC permissions system and user enhancement fields
-- Version: v5.6-p0
-- Date: 2026-03-22
-- Author: Ops Team
-- ============================================================================

-- Begin transaction
BEGIN;

-- ============================================================================
-- 1. Create permissions table for RBAC system
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraint to ensure unique permission per resource-action combination
    CONSTRAINT unique_permission_resource_action UNIQUE (resource, action)
);

-- Create indexes for permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_deleted_at ON permissions(deleted_at);

-- Add updated_at trigger for permissions
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_permissions_updated_at();

-- ============================================================================
-- 2. Create role_permissions table for role-permission mapping
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraint to ensure unique role-permission mapping
    CONSTRAINT unique_role_permission UNIQUE (role_name, permission_id)
);

-- Create indexes for role_permissions table
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_created_by ON role_permissions(created_by);

-- Add updated_at trigger for role_permissions
CREATE TRIGGER update_role_permissions_updated_at 
    BEFORE UPDATE ON role_permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_permissions_updated_at();

-- ============================================================================
-- 3. Create user_operation_logs table for audit tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_operation_logs table
CREATE INDEX IF NOT EXISTS idx_user_operation_logs_user_id ON user_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_operation_logs_operation ON user_operation_logs(operation);
CREATE INDEX IF NOT EXISTS idx_user_operation_logs_resource ON user_operation_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_operation_logs_created_at ON user_operation_logs(created_at);

-- ============================================================================
-- 4. Add real_name field to users table (if not exists)
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'real_name'
    ) THEN
        ALTER TABLE users ADD COLUMN real_name VARCHAR(100);
        RAISE NOTICE 'Added real_name column to users table';
    ELSE
        RAISE NOTICE 'real_name column already exists in users table';
    END IF;
END $$;

-- Create index for real_name field
CREATE INDEX IF NOT EXISTS idx_users_real_name ON users(real_name);

-- ============================================================================
-- 5. Insert default permissions
-- ============================================================================

-- Task permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
    ('task.create', '创建任务', '允许创建新任务', 'task', 'create'),
    ('task.read', '查看任务', '允许查看任务详情', 'task', 'read'),
    ('task.update', '更新任务', '允许更新任务信息', 'task', 'update'),
    ('task.delete', '删除任务', '允许删除任务', 'task', 'delete'),
    ('task.assign', '分配任务', '允许分配任务给其他人', 'task', 'assign'),
    ('task.comment', '评论任务', '允许对任务进行评论', 'task', 'comment')
ON CONFLICT (name) DO NOTHING;

-- User permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
    ('user.create', '创建用户', '允许创建新用户', 'user', 'create'),
    ('user.read', '查看用户', '允许查看用户信息', 'user', 'read'),
    ('user.update', '更新用户', '允许更新用户信息', 'user', 'update'),
    ('user.delete', '删除用户', '允许删除用户', 'user', 'delete')
ON CONFLICT (name) DO NOTHING;

-- System permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
    ('system.admin', '系统管理', '允许系统管理操作', 'system', 'admin'),
    ('system.config', '系统配置', '允许修改系统配置', 'system', 'config')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 6. Assign default permissions to roles
-- ============================================================================

-- Get permission IDs
DO $$
DECLARE
    task_create_perm UUID;
    task_read_perm UUID;
    task_update_perm UUID;
    task_delete_perm UUID;
    task_assign_perm UUID;
    task_comment_perm UUID;
    user_create_perm UUID;
    user_read_perm UUID;
    user_update_perm UUID;
    user_delete_perm UUID;
    system_admin_perm UUID;
    system_config_perm UUID;
BEGIN
    -- Get permission IDs
    SELECT id INTO task_create_perm FROM permissions WHERE name = 'task.create';
    SELECT id INTO task_read_perm FROM permissions WHERE name = 'task.read';
    SELECT id INTO task_update_perm FROM permissions WHERE name = 'task.update';
    SELECT id INTO task_delete_perm FROM permissions WHERE name = 'task.delete';
    SELECT id INTO task_assign_perm FROM permissions WHERE name = 'task.assign';
    SELECT id INTO task_comment_perm FROM permissions WHERE name = 'task.comment';
    SELECT id INTO user_create_perm FROM permissions WHERE name = 'user.create';
    SELECT id INTO user_read_perm FROM permissions WHERE name = 'user.read';
    SELECT id INTO user_update_perm FROM permissions WHERE name = 'user.update';
    SELECT id INTO user_delete_perm FROM permissions WHERE name = 'user.delete';
    SELECT id INTO system_admin_perm FROM permissions WHERE name = 'system.admin';
    SELECT id INTO system_config_perm FROM permissions WHERE name = 'system.config';
    
    -- Admin role - all permissions
    INSERT INTO role_permissions (role_name, permission_id) VALUES
        ('admin', task_create_perm),
        ('admin', task_read_perm),
        ('admin', task_update_perm),
        ('admin', task_delete_perm),
        ('admin', task_assign_perm),
        ('admin', task_comment_perm),
        ('admin', user_create_perm),
        ('admin', user_read_perm),
        ('admin', user_update_perm),
        ('admin', user_delete_perm),
        ('admin', system_admin_perm),
        ('admin', system_config_perm)
    ON CONFLICT (role_name, permission_id) DO NOTHING;
    
    -- Manager role - task management + user read
    INSERT INTO role_permissions (role_name, permission_id) VALUES
        ('manager', task_create_perm),
        ('manager', task_read_perm),
        ('manager', task_update_perm),
        ('manager', task_assign_perm),
        ('manager', task_comment_perm),
        ('manager', user_read_perm)
    ON CONFLICT (role_name, permission_id) DO NOTHING;
    
    -- User role - basic task operations
    INSERT INTO role_permissions (role_name, permission_id) VALUES
        ('user', task_create_perm),
        ('user', task_read_perm),
        ('user', task_update_perm),
        ('user', task_comment_perm)
    ON CONFLICT (role_name, permission_id) DO NOTHING;
END $$;

-- Commit transaction
COMMIT;

-- ============================================================================
-- 7. Verification queries
-- ============================================================================

-- Verify permissions table
SELECT 
    'permissions table' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) >= 12 THEN 'OK' ELSE 'ERROR' END as status
FROM permissions;

-- Verify role_permissions table
SELECT 
    'role_permissions table' as table_name,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) >= 22 THEN 'OK' ELSE 'ERROR' END as status
FROM role_permissions;

-- Verify user_operation_logs table exists
SELECT 
    'user_operation_logs table' as table_name,
    COUNT(*) as column_count,
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'ERROR' END as status
FROM information_schema.columns 
WHERE table_name = 'user_operation_logs' AND table_schema = 'public';

-- Verify users table real_name field
SELECT 
    'users table real_name field' as check_item,
    COUNT(*) as field_count,
    CASE WHEN COUNT(*) >= 1 THEN 'OK' ELSE 'ERROR' END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'real_name'
AND table_schema = 'public';

-- Migration complete
SELECT 'V5.6 P0 migration completed successfully' as message;
