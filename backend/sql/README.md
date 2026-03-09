# Database SQL Scripts

This directory contains SQL scripts for database initialization and migration.

## Directory Structure

```
sql/
├── init.sql              # Database initialization script
├── migrations/           # Database migration scripts (if needed)
└── README.md             # This file
```

## Initialization

To initialize the database, run:

```bash
psql -h localhost -U admin -d agent_task_test -f sql/init.sql
```

Or from within Docker:

```bash
docker exec -i agent-task-postgres-test psql -U admin -d agent_task_test < sql/init.sql
```

## Schema Management

**Important**: TypeORM `synchronize` option is disabled. All schema changes must be done via SQL scripts.

### Adding New Tables

1. Create a migration script in `migrations/` directory
2. Name the script with a descriptive name and timestamp
3. Run the migration script on the database
4. Update the corresponding TypeScript entity to match

### Modifying Existing Tables

1. Create a migration script in `migrations/` directory
2. Use `ALTER TABLE` statements for changes
3. Run the migration script on the database
4. Update the corresponding TypeScript entity to match

## Enum Types

The following enum types are defined:

- `tasks_status_enum`: todo, in_progress, review, done, blocked
- `tasks_priority_enum`: low, medium, high, urgent
- `agents_type_enum`: developer, designer, qa, architect, pm, devops
- `agents_status_enum`: online, offline, busy
- `agents_role_enum`: admin, worker
- `notifications_type_enum`: task_created, task_assigned, task_completed, task_updated, system_message, agent_message, comment_added
- `task_templates_category_enum`: development, design, marketing, operations, general
- `task_templates_defaultpriority_enum`: low, medium, high, urgent
- `agent_stats_period_type_enum`: day, week, month, all_time
- `task_status_history_changed_by_type_enum`: user, agent

## Notes

- The `init.sql` script will drop all existing tables and recreate them
- Use with caution in production environments
- Always backup your database before running migrations
