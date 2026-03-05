import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateNotificationsTable1709747400000 implements MigrationInterface {
  name = 'CreateNotificationsTable1709747400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建notifications表
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'agent_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
      },
      }),
      true,
    );

    // 2. 创建索引
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_agent_id_read',
        columnNames: ['agent_id', 'read'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_agent_id_created_at',
        columnNames: ['agent_id', 'created_at'],
      }),
    );

    // 3. 创建外键
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        name: 'FK_notifications_agent_id',
        columnNames: ['agent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agents',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    await queryRunner.dropForeignKey('notifications', 'FK_notifications_agent_id');

    // 删除索引
    await queryRunner.dropIndex('notifications', 'IDX_notifications_agent_id_created_at');
    await queryRunner.dropIndex('notifications', 'IDX_notifications_agent_id_read');

    // 删除表
    await queryRunner.dropTable('notifications');
  }
}
