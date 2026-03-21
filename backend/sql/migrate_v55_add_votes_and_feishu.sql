-- V5.5 Migration: Add votes table and feishu_open_id field
-- Created: 2026-03-21
-- Author: Dev1
-- Purpose: Support V5.5 task voting feature and Feishu user registration

-- ============================================================
-- 1. Create votes table for task voting feature
-- ============================================================

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)  -- Prevent duplicate votes
);

-- Indexes for votes table
CREATE INDEX IF NOT EXISTS idx_votes_task_id ON votes(task_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_votes_updated_at 
    BEFORE UPDATE ON votes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. Add feishu_open_id field to users table
-- ============================================================

-- Add feishu_open_id column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'feishu_open_id'
    ) THEN
        ALTER TABLE users ADD COLUMN feishu_open_id VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Added feishu_open_id column to users table';
    ELSE
        RAISE NOTICE 'feishu_open_id column already exists in users table';
    END IF;
END $$;

-- Add index for feishu_open_id
CREATE INDEX IF NOT EXISTS idx_users_feishu_open_id ON users(feishu_open_id);

-- Optional: Add Feishu user information fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'feishu_name'
    ) THEN
        ALTER TABLE users ADD COLUMN feishu_name VARCHAR(255);
        ALTER TABLE users ADD COLUMN feishu_avatar_url TEXT;
        RAISE NOTICE 'Added feishu_name and feishu_avatar_url columns to users table';
    ELSE
        RAISE NOTICE 'Feishu user info columns already exist in users table';
    END IF;
END $$;

-- ============================================================
-- 3. Verification queries
-- ============================================================

-- Verify votes table structure
SELECT 
    'votes table' as table_name,
    COUNT(*) as column_count,
    CASE WHEN COUNT(*) >= 7 THEN 'OK' ELSE 'ERROR' END as status
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public';

-- Verify users table feishu fields
SELECT 
    'users table feishu fields' as check_item,
    COUNT(*) as field_count,
    CASE WHEN COUNT(*) >= 1 THEN 'OK' ELSE 'ERROR' END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('feishu_open_id', 'feishu_name', 'feishu_avatar_url')
AND table_schema = 'public';

-- Migration complete
SELECT 'V5.5 migration completed successfully' as message;
