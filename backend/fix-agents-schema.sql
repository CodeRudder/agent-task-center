-- Fix agents table schema - Add missing fields
-- Date: 2026-03-20
-- Issue: 3100 white screen due to missing database fields

-- Add api_token_hash field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_token_hash VARCHAR(255) UNIQUE;

-- Add api_token field (plain text token)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_token VARCHAR(64) UNIQUE;

-- Add api_token_expires_at field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_token_expires_at TIMESTAMP;

-- Add metadata field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add created_by field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add token_created_at field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP;

-- Add last_api_call_at field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_api_call_at TIMESTAMP;

-- Add last_api_access_at field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_api_access_at TIMESTAMP;

-- Add role field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'worker';

-- Create index on api_token
CREATE INDEX IF NOT EXISTS IDX_agents_api_token ON agents(api_token);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;
