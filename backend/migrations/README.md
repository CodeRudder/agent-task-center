# Database Migrations

This directory contains SQL migration scripts for database schema changes.

## Naming Convention

Migration scripts should be named using the following format:

```
{timestamp}_{description}.sql
```

Example: `20260308_001_add_blocked_status_to_tasks.sql`

## Creating a Migration

1. Create a new SQL file with the appropriate name
2. Write your migration SQL using `ALTER TABLE`, `CREATE TABLE`, `DROP TABLE`, etc.
3. Test the migration in a development environment first
4. Document the purpose and impact in the file header

## Migration Script Template

```sql
-- ============================================================================
-- Migration: {Description}
-- ============================================================================
-- Version: 1.0.0
-- Date: YYYY-MM-DD
-- Author: Your Name
-- Description: Brief description of what this migration does
-- ============================================================================

-- Add your migration SQL here

-- Verify the migration
-- SELECT * FROM ...;

-- ============================================================================
-- End of Migration
-- ============================================================================
```

## Running Migrations

To run a migration:

```bash
psql -h localhost -U admin -d agent_task_test -f migrations/20260308_001_add_blocked_status_to_tasks.sql
```

Or from within Docker:

```bash
docker exec -i agent-task-postgres-test psql -U admin -d agent_task_test < migrations/20260308_001_add_blocked_status_to_tasks.sql
```

## Rollback

Each migration should include a rollback section or a separate rollback script.

Example rollback script name: `20260308_001_rollback_add_blocked_status_to_tasks.sql`

## Best Practices

1. **Always test migrations** in a development environment first
2. **Use transactions** for complex migrations
3. **Add comments** to explain complex changes
4. **Keep migrations small and focused** - one logical change per file
5. **Order matters** - migrations are applied in filename order
6. **Never modify** an existing migration - create a new one instead
7. **Backward compatibility** - consider if the migration is backward compatible

## Common Patterns

### Adding a Column

```sql
ALTER TABLE tasks ADD COLUMN blocked_at TIMESTAMP;
```

### Adding an Index

```sql
CREATE INDEX idx_tasks_blocked_at ON tasks(blocked_at);
```

### Adding a New Enum Value

```sql
ALTER TYPE tasks_status_enum ADD VALUE 'archived';
```

### Renaming a Column

```sql
ALTER TABLE tasks RENAME COLUMN old_name TO new_name;
```

### Adding a Foreign Key

```sql
ALTER TABLE tasks
ADD CONSTRAINT fk_assignee_id
FOREIGN KEY (assignee_id) REFERENCES users(id);
```

## Notes

- Always backup your database before running migrations
- Test migrations with sample data
- Document breaking changes
- Communicate migration plans to the team
