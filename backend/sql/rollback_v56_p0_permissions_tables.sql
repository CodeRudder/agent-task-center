-- ============================================================================
-- V5.6 P0 Rollback Script: Remove Permissions System and User Fields
-- ============================================================================
-- Purpose: Rollback V5.6 P0 migration - Remove RBAC permissions system
-- Version: v5.6-p0
-- Date: 2026-03-22
-- Author: Ops Team
-- ============================================================================

-- Begin transaction
BEGIN;

-- ============================================================================
-- 1. Drop role_permissions table (must be dropped before permissions due to FK)
-- ============================================================================

DROP TABLE IF EXISTS role_permissions CASCADE;

-- ============================================================================
-- 2. Drop permissions table
-- ============================================================================

DROP TABLE IF EXISTS permissions CASCADE;

-- ============================================================================
-- 3. Drop user_operation_logs table
-- ============================================================================

DROP TABLE IF EXISTS user_operation_logs CASCADE;

-- ============================================================================
-- 4. Remove real_name field from users table
-- ============================================================================

ALTER TABLE users DROP COLUMN IF EXISTS real_name;

-- ============================================================================
-- 5. Drop triggers and functions
-- ============================================================================

DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;
DROP FUNCTION IF EXISTS update_permissions_updated_at();

-- Commit transaction
COMMIT;

-- ============================================================================
-- 6. Verification queries
-- ============================================================================

-- Verify tables are dropped
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK - All tables dropped'
        ELSE 'ERROR - Some tables still exist'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('permissions', 'role_permissions', 'user_operation_logs')
AND table_schema = 'public';

-- Verify real_name field is removed
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK - real_name field removed'
        ELSE 'ERROR - real_name field still exists'
    END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'real_name'
AND table_schema = 'public';

-- Rollback complete
SELECT 'V5.6 P0 rollback completed successfully' as message;
