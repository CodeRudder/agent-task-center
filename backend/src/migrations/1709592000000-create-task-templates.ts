import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTaskTemplates1709592000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'task_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['development', 'design', 'marketing', 'operations', 'general'],
            default: "'general'",
          },
          {
            name: 'defaultPriority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'urgent'],
            default: "'medium'",
          },
          {
            name: 'defaultTitle',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'defaultDescription',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'defaultMetadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'estimatedMinutes',
            type: 'int',
            default: 0,
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdById',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['createdById'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'task_templates',
      new TableIndex({
        name: 'IDX_task_templates_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'task_templates',
      new TableIndex({
        name: 'IDX_task_templates_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'task_templates',
      new TableIndex({
        name: 'IDX_task_templates_createdById',
        columnNames: ['createdById'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_templates');
  }
}
