-- ============================================================================
-- Users Table Creation Migration
-- ============================================================================
-- Description: Create users table with all required fields and indexes
-- Version: 1.0.0
-- Date: 2026-04-05
-- ============================================================================

-- Drop table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
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

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_feishu_open_id ON users(feishu_open_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_role ON users(role);

-- Insert default admin user (password: admin123)
-- Password hash generated using bcrypt.hashSync('admin123', 10)
INSERT INTO users (
  username, 
  email, 
  password, 
  display_name, 
  role, 
  is_active
) VALUES (
  'admin', 
  'admin@example.com', 
  '$2b$10$DubeYV3nQ/PHXGJ8YJ.KVeKMXYnjmd.RAqR4eYKobawE7qvZlSBmi', 
  'Administrator', 
  'admin', 
  true
);

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
