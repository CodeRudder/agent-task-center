-- ============================================================================
-- Database Initialization Script - Complete Tables
-- ============================================================================
-- Description: Initialize all database tables for agent-task-system
-- Version: 1.0.0
-- Date: 2026-04-05
-- ============================================================================

-- ============================================================================
-- 1. Base Tables (categories, tags, agents)
-- ============================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  level INTEGER DEFAULT 1,
  path VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#1890ff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_deleted_at ON tags(deleted_at);

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  capabilities JSONB DEFAULT '[]',
  max_concurrent_tasks INTEGER DEFAULT 5,
  api_token VARCHAR(255) UNIQUE,
  avatar VARCHAR(500),
  last_heartbeat_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_deleted_at ON agents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_agents_capabilities ON agents USING GIN(capabilities);

-- ============================================================================
-- 2. Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'user',
  feishu_open_id VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_feishu_open_id ON users(feishu_open_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 3. Tasks Table
-- ============================================================================

CREATE TYPE IF NOT EXISTS tasks_status_enum AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
CREATE TYPE IF NOT EXISTS tasks_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status tasks_status_enum DEFAULT 'todo',
  priority tasks_priority_enum DEFAULT 'medium',
  progress INTEGER DEFAULT 0,
  due_date TIMESTAMP,
  assignee_id UUID REFERENCES users(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID,
  metadata JSONB DEFAULT '{}',
  template_id VARCHAR(36),
  version INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  blocked_at TIMESTAMP,
  block_reason TEXT,
  last_api_call_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_duedate ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- ============================================================================
-- 4. Task Status Histories Table
-- ============================================================================

CREATE TYPE IF NOT EXISTS task_status_history_changed_by_type_enum AS ENUM ('user', 'agent');

CREATE TABLE IF NOT EXISTS task_status_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  old_status tasks_status_enum NOT NULL,
  new_status tasks_status_enum NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_type task_status_history_changed_by_type_enum NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changer_id UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_task_status_histories_task_id_changed_at ON task_status_histories(task_id, changed_at);

-- ============================================================================
-- 5. Task Templates Table
-- ============================================================================

CREATE TYPE IF NOT EXISTS task_templates_category_enum AS ENUM ('development', 'design', 'marketing', 'operations', 'general');
CREATE TYPE IF NOT EXISTS task_templates_defaultpriority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category task_templates_category_enum DEFAULT 'general',
  default_priority task_templates_defaultpriority_enum DEFAULT 'medium',
  default_title TEXT,
  default_description TEXT,
  default_metadata JSONB,
  tags JSONB,
  estimated_minutes INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_templates_name ON task_templates(name);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_active ON task_templates(is_active);

-- ============================================================================
-- 6. Comments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ============================================================================
-- 7. Notifications Table
-- ============================================================================

CREATE TYPE IF NOT EXISTS notifications_type_enum AS ENUM (
  'task_created', 'task_assigned', 'task_completed', 'task_updated',
  'system_message', 'agent_message', 'comment_added'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  type notifications_type_enum NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  related_task_id UUID,
  related_comment_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id_is_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_task_id ON notifications(related_task_id);

-- ============================================================================
-- 8. Agent Stats Table
-- ============================================================================

CREATE TYPE IF NOT EXISTS agent_stats_period_type_enum AS ENUM ('day', 'week', 'month', 'all_time');

CREATE TABLE IF NOT EXISTS agent_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  accepted_tasks INTEGER DEFAULT 0,
  rejected_tasks INTEGER DEFAULT 0,
  avg_completion_time_hours DECIMAL(10,2) DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0,
  period_type agent_stats_period_type_enum NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_agent_stats_agent_id ON agent_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_period_type ON agent_stats(period_type);

-- ============================================================================
-- 9. API Access Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_access_logs_agent_id ON api_access_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_access_logs_created_at ON api_access_logs(created_at);

-- ============================================================================
-- 10. Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_type VARCHAR(20) NOT NULL CHECK (operator_type IN ('user', 'agent', 'system')),
  operator_id UUID,
  operation VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator_type, operator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 11. Webhook Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255),
  events TEXT[] NOT NULL,
  headers JSONB DEFAULT '{}',
  template JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout INTEGER DEFAULT 5000,
  project_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_configurations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_configurations_project_id ON webhook_configurations(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configurations_is_active ON webhook_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at ON webhook_logs(sent_at);

-- ============================================================================
-- 12. Initial Data
-- ============================================================================

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, display_name, role, is_active) VALUES
('admin', 'admin@example.com', '$2b$10$DubeYV3nQ/PHXGJ8YJ.KVeKMXYnjmd.RAqR4eYKobawE7qvZlSBmi', 'Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, level, sort_order) VALUES
('开发', 1, 1),
('测试', 1, 2),
('设计', 1, 3)
ON CONFLICT DO NOTHING;

-- Insert tags
INSERT INTO tags (name, color) VALUES
('紧急', '#f5222d'),
('重要', '#fa8c16'),
('优化', '#52c41a'),
('Bug', '#eb2f96')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Complete
-- ============================================================================
SELECT 'Database initialization completed successfully!' as status;
