-- Migration: Add project_id column to tasks table
-- Date: 2026-04-02
-- Author: fullstack-dev
-- Description: Fix Task module 500 errors by adding missing project_id column

-- Add project_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id UUID;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_tasks_project'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Success message
SELECT 'Migration completed: project_id column added to tasks table' as result;