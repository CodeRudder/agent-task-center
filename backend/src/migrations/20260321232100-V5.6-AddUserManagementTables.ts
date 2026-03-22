import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class V56AddUserManagementTables1773486191000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 扩展users表（添加新字段）
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS department VARCHAR(100),
      ADD COLUMN IF NOT EXISTS position VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
    `);

    // 创建索引
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_phone',
        columnNames: ['phone'],
      }),
    );

    // 2. 创建permissions表（权限表）
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimary: true },
          { name: 'name', type: 'VARCHAR(100)', isUnique: true },
          { name: 'description', type: 'TEXT', isNullable: true },
          { name: 'resource_type', type: 'VARCHAR(50)', isNullable: true },
          { name: 'action', type: 'VARCHAR(50)', isNullable: true },
          { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'idx_permissions_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'idx_permissions_resource_action',
        columnNames: ['resource_type', 'action'],
      }),
    );

    // 3. 创建role_permissions表（角色权限关联表）
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimary: true },
          { name: 'role', type: 'VARCHAR(50)' },
          { name: 'permission_id', type: 'INTEGER' },
          { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建外键
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'fk_role_permissions_permission',
        columnNames: ['permission_id'],
        referencedTableName: 'permissions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 创建索引
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'idx_role_permissions_role',
        columnNames: ['role'],
      }),
    );

    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'idx_role_permissions_composite',
        columnNames: ['role', 'permission_id'],
        isUnique: true,
      }),
    );

    // 4. 创建user_operation_logs表（用户操作日志表）
    await queryRunner.createTable(
      new Table({
        name: 'user_operation_logs',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimary: true },
          { name: 'user_id', type: 'UUID' },
          { name: 'operation', type: 'VARCHAR(50)' },
          { name: 'resource_type', type: 'VARCHAR(50)', isNullable: true },
          { name: 'resource_id', type: 'VARCHAR(100)', isNullable: true },
          { name: 'description', type: 'TEXT', isNullable: true },
          { name: 'ip_address', type: 'VARCHAR(50)', isNullable: true },
          { name: 'user_agent', type: 'TEXT', isNullable: true },
          { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建外键
    await queryRunner.createForeignKey(
      'user_operation_logs',
      new TableForeignKey({
        name: 'fk_user_operation_logs_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 创建索引
    await queryRunner.createIndex(
      'user_operation_logs',
      new TableIndex({
        name: 'idx_user_logs_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_operation_logs',
      new TableIndex({
        name: 'idx_user_logs_operation',
        columnNames: ['operation'],
      }),
    );

    await queryRunner.createIndex(
      'user_operation_logs',
      new TableIndex({
        name: 'idx_user_logs_created_at',
        columnNames: ['created_at'],
      }),
    );

    // 5. 创建user_preferences表（用户偏好设置表）
    await queryRunner.createTable(
      new Table({
        name: 'user_preferences',
        columns: [
          { name: 'id', type: 'SERIAL', isPrimary: true },
          { name: 'user_id', type: 'UUID', isUnique: true },
          { name: 'theme', type: 'VARCHAR(20)', default: "'light'" },
          { name: 'language', type: 'VARCHAR(10)', default: "'zh-CN'" },
          { name: 'notifications', type: 'JSONB', default: `'{\"email\": true, \"browser\": true}'` },
          { name: 'dashboard', type: 'JSONB', default: `'{\"default_view\": \"list\"}'` },
          { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建外键
    await queryRunner.createForeignKey(
      'user_preferences',
      new TableForeignKey({
        name: 'fk_user_preferences_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 创建索引
    await queryRunner.createIndex(
      'user_preferences',
      new TableIndex({
        name: 'idx_user_preferences_user_id',
        columnNames: ['user_id'],
      }),
    );

    // 6. 插入默认权限数据
    await queryRunner.query(`
      INSERT INTO permissions (name, description, resource_type, action) VALUES
      ('task:create', '创建任务', 'task', 'create'),
      ('task:read', '查看任务', 'task', 'read'),
      ('task:update', '更新任务', 'task', 'update'),
      ('task:delete', '删除任务', 'task', 'delete'),
      ('user:create', '创建用户', 'user', 'create'),
      ('user:read', '查看用户', 'user', 'read'),
      ('user:update', '更新用户', 'user', 'update'),
      ('user:delete', '删除用户', 'user', 'delete'),
      ('permission:manage', '管理权限', 'permission', 'manage'),
      ('notification:push', '推送通知', 'notification', 'push')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 7. 插入默认角色权限关联
    await queryRunner.query(`
      INSERT INTO role_permissions (role, permission_id)
      SELECT 'admin', id FROM permissions
      UNION ALL
      SELECT 'project_manager', id FROM permissions WHERE name IN ('task:create', 'task:read', 'task:update', 'task:delete', 'user:read')
      UNION ALL
      SELECT 'user', id FROM permissions WHERE name IN ('task:read', 'task:create', 'task:update');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除表（按依赖关系倒序删除）
    await queryRunner.dropTable('user_preferences');
    await queryRunner.dropTable('user_operation_logs');
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('permissions');

    // 删除users表的新增字段
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS department,
      DROP COLUMN IF EXISTS position,
      DROP COLUMN IF EXISTS bio,
      DROP COLUMN IF EXISTS preferences,
      DROP COLUMN IF EXISTS last_login_at,
      DROP COLUMN IF EXISTS login_count;
    `);

    // 删除索引
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_phone;`);
  }
}
