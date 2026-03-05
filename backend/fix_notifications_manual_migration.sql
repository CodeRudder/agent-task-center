-- Manual migration for notifications table
-- P3.2 fix - notifications table was missing
-- Executed on 2026-03-06

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_notifications_agent_id FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IDX_notifications_agent_id_read ON notifications(agent_id, read);
CREATE INDEX IF NOT EXISTS IDX_notifications_agent_id_created_at ON notifications(agent_id, created_at);
