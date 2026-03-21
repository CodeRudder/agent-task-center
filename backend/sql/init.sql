-- ============================================================================
-- Database Initialization Script
-- ============================================================================
-- Description: Initialize database schema for agent-task-system
-- Version: 1.0.0
-- Date: 2026-03-08
-- ============================================================================

-- Drop existing tables (if any)
DROP TABLE IF EXISTS task_status_histories CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS agent_stats CASCADE;
DROP TABLE IF EXISTS api_access_logs CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enum types
DROP TYPE IF EXISTS tasks_status_enum CASCADE;
DROP TYPE IF EXISTS tasks_priority_enum CASCADE;
DROP TYPE IF EXISTS agents_type_enum CASCADE;
DROP TYPE IF EXISTS agents_status_enum CASCADE;
DROP TYPE IF EXISTS agents_role_enum CASCADE;
DROP TYPE IF EXISTS notifications_type_enum CASCADE;
DROP TYPE IF EXISTS task_templates_category_enum CASCADE;
DROP TYPE IF EXISTS task_templates_defaultpriority_enum CASCADE;
DROP TYPE IF EXISTS agent_stats_period_type_enum CASCADE;
DROP TYPE IF EXISTS task_status_history_changed_by_type_enum CASCADE;

-- ============================================================================
-- Enum Types
-- ============================================================================

-- Task Status Enum
CREATE TYPE tasks_status_enum AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');

-- Task Priority Enum
CREATE TYPE tasks_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

-- Agent Type Enum
CREATE TYPE agents_type_enum AS ENUM ('developer', 'designer', 'qa', 'architect', 'pm', 'devops');

-- Agent Status Enum
CREATE TYPE agents_status_enum AS ENUM ('online', 'offline', 'busy');

-- Agent Role Enum
CREATE TYPE agents_role_enum AS ENUM ('admin', 'worker');

-- Notification Type Enum
CREATE TYPE notifications_type_enum AS ENUM (
  'task_created', 'task_assigned', 'task_completed', 'task_updated',
  'system_message', 'agent_message', 'comment_added'
);

-- Task Template Category Enum
CREATE TYPE task_templates_category_enum AS ENUM (
  'development', 'design', 'marketing', 'operations', 'general'
);

-- Task Template Default Priority Enum
CREATE TYPE task_templates_defaultpriority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

-- Agent Stats Period Type Enum
CREATE TYPE agent_stats_period_type_enum AS ENUM ('day', 'week', 'month', 'all_time');

-- Task Status History Changed By Type Enum
CREATE TYPE task_status_history_changed_by_type_enum AS ENUM ('user', 'agent');

-- ============================================================================
-- Tables
-- ============================================================================

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  feishu_open_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
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

-- Task Status Histories Table
CREATE TABLE task_status_histories (
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

-- Agents Table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type agents_type_enum DEFAULT 'developer',
  description TEXT,
  capabilities TEXT[],
  status agents_status_enum DEFAULT 'offline',
  max_concurrent_tasks INTEGER DEFAULT 5,
  api_token VARCHAR(64) UNIQUE,
  api_token_hash VARCHAR(255) UNIQUE,
  api_token_expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  token_created_at TIMESTAMP,
  last_api_call_at TIMESTAMP,
  last_api_access_at TIMESTAMP,
  role agents_role_enum DEFAULT 'worker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Agent Stats Table
CREATE TABLE agent_stats (
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

-- API Access Logs Table
CREATE TABLE api_access_logs (
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

-- Task Templates Table
CREATE TABLE task_templates (
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

-- Notifications Table
CREATE TABLE notifications (
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

-- Comments Table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Users Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_feishu_open_id ON users(feishu_open_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Tasks Indexes
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_duedate ON tasks(due_date);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);

-- Task Status Histories Indexes
CREATE INDEX idx_task_status_histories_task_id_changed_at ON task_status_histories(task_id, changed_at);

-- Agents Indexes
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_api_token ON agents(api_token);
CREATE INDEX idx_agents_api_token_hash ON agents(api_token_hash);

-- Agent Stats Indexes
CREATE INDEX idx_agent_stats_agent_id ON agent_stats(agent_id);
CREATE INDEX idx_agent_stats_period_type ON agent_stats(period_type);

-- API Access Logs Indexes
CREATE INDEX idx_api_access_logs_agent_id ON api_access_logs(agent_id);
CREATE INDEX idx_api_access_logs_created_at ON api_access_logs(created_at);

-- Task Templates Indexes
CREATE INDEX idx_task_templates_name ON task_templates(name);
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_created_by ON task_templates(created_by);
CREATE INDEX idx_task_templates_is_active ON task_templates(is_active);

-- Notifications Indexes
CREATE INDEX idx_notifications_recipient_id_is_read ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX idx_notifications_related_task_id ON notifications(related_task_id);

-- Comments Indexes
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default admin user (password: admin123 - should be changed in production)
-- Note: This is a placeholder, password should be hashed in real deployment
INSERT INTO users (email, password, name, role, is_active) VALUES
('admin@example.com', '$2b$10$placeholder_hash_change_me', 'Admin User', 'admin', true);

-- ============================================================================
-- Complete
-- ============================================================================
SELECT 'Database initialization completed successfully!' as status;
