-- ============================================================================
-- Database Migration Script: v5.2 to v5.3
-- ============================================================================
-- Description: Migrate User table schema from v5.2 to v5.3
-- Date: 2026-03-19
-- ============================================================================

-- Begin transaction
BEGIN;

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

-- Step 2: Migrate data from old columns to new columns
UPDATE users SET 
  username = LOWER(SPLIT_PART(email, '@', 1)),
  display_name = COALESCE(name, SPLIT_PART(email, '@', 1)),
  avatar_url = avatar
WHERE username IS NULL OR display_name IS NULL;

-- Step 3: Make username unique and NOT NULL
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Step 4: Make display_name NOT NULL
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE users DROP COLUMN IF EXISTS name;
ALTER TABLE users DROP COLUMN IF EXISTS avatar;

-- Step 6: Create index on username for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Commit transaction
COMMIT;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('username', 'display_name', 'avatar_url', 'name', 'avatar')
ORDER BY column_name;
