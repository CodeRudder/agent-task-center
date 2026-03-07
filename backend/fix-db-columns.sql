-- Fix users table columns to use snake_case naming
ALTER TABLE users RENAME COLUMN "feishuOpenId" TO "feishu_open_id";

-- Fix tasks table columns to use snake_case naming
-- These columns might have camelCase names in the database
DO $$
BEGIN
    -- Check and rename dueDate if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'dueDate'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN "dueDate" TO "due_date";
    END IF;

    -- Check and rename assigneeId if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'assigneeId'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN "assigneeId" TO "assignee_id";
    END IF;

    -- Check and rename parentId if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'parentId'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN "parentId" TO "parent_id";
    END IF;

    -- Check and rename categoryId if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'categoryId'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN "categoryId" TO "category_id";
    END IF;

    -- Check and rename creatorId if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'creatorId'
    ) THEN
        ALTER TABLE tasks RENAME COLUMN "creatorId" TO "creator_id";
    END IF;
END $$;

-- Fix agents table columns
DO $$
BEGIN
    -- Check and rename apiToken if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'agents'
        AND column_name = 'apiToken'
    ) THEN
        ALTER TABLE agents RENAME COLUMN "apiToken" TO "api_token";
    END IF;

    -- Check and rename apiTokenHash if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'agents'
        AND column_name = 'apiTokenHash'
    ) THEN
        ALTER TABLE agents RENAME COLUMN "apiTokenHash" TO "api_token_hash";
    END IF;

    -- Check and rename apiTokenExpiresAt if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'agents'
        AND column_name = 'apiTokenExpiresAt'
    ) THEN
        ALTER TABLE agents RENAME COLUMN "apiTokenExpiresAt" TO "api_token_expires_at";
    END IF;

    -- Check and rename lastApiAccessAt if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'agents'
        AND column_name = 'lastApiAccessAt'
    ) THEN
        ALTER TABLE agents RENAME COLUMN "lastApiAccessAt" TO "last_api_access_at";
    END IF;

    -- Check and rename maxConcurrentTasks if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'agents'
        AND column_name = 'maxConcurrentTasks'
    ) THEN
        ALTER TABLE agents RENAME COLUMN "maxConcurrentTasks" TO "max_concurrent_tasks";
    END IF;
END $$;
