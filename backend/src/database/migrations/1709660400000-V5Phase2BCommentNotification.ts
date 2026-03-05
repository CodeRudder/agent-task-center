import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class V5Phase2BCommentNotification1709660400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create comments table
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'task_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'author_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'mentions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for comments
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for comments
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_TASK_ID',
        columnNames: ['task_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_AUTHOR_ID',
        columnNames: ['author_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENTS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    // 2. Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
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
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for notifications
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['agent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agents',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for notifications
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_AGENT_ID_READ',
        columnNames: ['agent_id', 'read'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_AGENT_ID_CREATED_AT',
        columnNames: ['agent_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop notifications table
    await queryRunner.dropTable('notifications', true);

    // Drop comments table
    await queryRunner.dropTable('comments', true);
  }
}
