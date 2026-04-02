-- Migration: Add changer_name and changer_id to task_status_histories table
-- Date: 2026-04-02
-- Author: fullstack-dev
-- Description: Fix Task module update API 500 errors (BUG-025)

-- Add changer_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_status_histories' AND column_name = 'changer_name'
  ) THEN
    ALTER TABLE task_status_histories ADD COLUMN changer_name VARCHAR(255);
  END IF;
END $$;

-- Add changer_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_status_histories' AND column_name = 'changer_id'
  ) THEN
    ALTER TABLE task_status_histories ADD COLUMN changer_id UUID;
  END IF;
END $$;

-- Success message
SELECT 'Migration completed: changer_name and changer_id columns added to task_status_histories table' as result;