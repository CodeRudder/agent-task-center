-- Migration: Add api_keys table
-- Version: V5.9
-- Description: Create api_keys table for API key management

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Add comments for documentation
COMMENT ON TABLE api_keys IS 'API keys for external access to the system';
COMMENT ON COLUMN api_keys.id IS 'Unique identifier for the API key';
COMMENT ON COLUMN api_keys.name IS 'Human-readable name for the API key';
COMMENT ON COLUMN api_keys.key_hash IS 'Hashed API key value (SHA-256)';
COMMENT ON COLUMN api_keys.key_prefix IS 'Prefix of the API key for identification (e.g., "atk_")';
COMMENT ON COLUMN api_keys.permissions IS 'Array of permission strings';
COMMENT ON COLUMN api_keys.is_active IS 'Whether the API key is currently active';
COMMENT ON COLUMN api_keys.last_used_at IS 'Timestamp of the last successful use of this key';
COMMENT ON COLUMN api_keys.expires_at IS 'Expiration timestamp for the API key';
COMMENT ON COLUMN api_keys.created_by IS 'UUID of the user who created this API key';
COMMENT ON COLUMN api_keys.created_at IS 'Timestamp when the API key was created';
