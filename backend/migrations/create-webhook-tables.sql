-- ============================================================================
-- Webhook Tables Migration
-- ============================================================================
-- Description: Create webhook_configurations and webhook_logs tables
-- Version: V5.9-fix
-- Date: 2026-04-05
-- Author: architect
-- ============================================================================

-- ============================================================================
-- 1. Webhook Configurations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  template JSONB,
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout INTEGER DEFAULT 5000,
  project_id VARCHAR NOT NULL,
  created_by VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for webhook_configurations
CREATE INDEX IF NOT EXISTS idx_webhook_project_id ON webhook_configurations(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_is_active ON webhook_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_created_by ON webhook_configurations(created_by);

-- ============================================================================
-- 2. Webhook Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  response_code INTEGER,
  response_body TEXT,
  status VARCHAR(50),
  attempt INTEGER DEFAULT 1,
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_executed_at ON webhook_logs(executed_at);

-- ============================================================================
-- 3. Add Foreign Key Constraints (Optional)
-- ============================================================================
-- Note: Foreign keys are NOT enforced to maintain flexibility
-- Uncomment below if you want to enforce referential integrity
--
-- ALTER TABLE webhook_configurations
--   ADD CONSTRAINT fk_webhook_project
--   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
--
-- ALTER TABLE webhook_logs
--   ADD CONSTRAINT fk_webhook_log_webhook
--   FOREIGN KEY (webhook_id) REFERENCES webhook_configurations(id) ON DELETE CASCADE;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Version: V5.9-fix
-- Date: 2026-04-05
-- Status: completed
-- ============================================================================
