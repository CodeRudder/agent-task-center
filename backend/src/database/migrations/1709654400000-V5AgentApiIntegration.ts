import { MigrationInterface, QueryRunner, TableColumn, TableIndex, Table } from 'typeorm';

export class V5AgentApiIntegration1709654400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 为agents表添加新字段
    // 重命名现有api_token为api_token_hash（向后兼容）
    await queryRunner.renameColumn('agents', 'api_token', 'api_token_hash');

    // 添加api_token字段（存储明文token，用于快速查询）
    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'api_token',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: true,
      }),
    );

    // 添加token过期时间
    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'api_token_expires_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // 添加最后API访问时间
    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'last_api_access_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // 添加角色字段
    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['admin_agent', 'worker_agent', 'readonly_agent'],
        default: "'worker_agent'",
      }),
    );

    // 添加索引
    await queryRunner.createIndex(
      'agents',
      new TableIndex({
        name: 'IDX_agents_api_token',
        columnNames: ['api_token'],
      }),
    );

    // 2. 创建api_access_logs表
    await queryRunner.createTable(
      new Table({
        name: 'api_access_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agent_id',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'status_code',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'response_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 添加api_access_logs索引
    await queryRunner.createIndex(
      'api_access_logs',
      new TableIndex({
        name: 'IDX_api_logs_agent_created',
        columnNames: ['agent_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'api_access_logs',
      new TableIndex({
        name: 'IDX_api_logs_endpoint_created',
        columnNames: ['endpoint', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除api_access_logs表
    await queryRunner.dropTable('api_access_logs');

    // 删除agents表的新字段
    await queryRunner.dropColumn('agents', 'role');
    await queryRunner.dropColumn('agents', 'last_api_access_at');
    await queryRunner.dropColumn('agents', 'api_token_expires_at');
    await queryRunner.dropColumn('agents', 'api_token');

    // 恢复原来的api_token字段名
    await queryRunner.renameColumn('agents', 'api_token_hash', 'api_token');
  }
}
