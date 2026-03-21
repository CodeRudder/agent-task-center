import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTagsCategories1773486191000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建tags表
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '50', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'color', type: 'varchar', length: '7', default: "'#3B82F6'" },
          { name: 'usage_count', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建categories表
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '50', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'color', type: 'varchar', length: '7', default: "'#10B981'" },
          { name: 'usage_count', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 创建task_tags连接表
    await queryRunner.createTable(
      new Table({
        name: 'task_tags',
        columns: [
          { name: 'task_id', type: 'uuid', isPrimary: true },
          { name: 'tag_id', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    // 创建task_categories连接表
    await queryRunner.createTable(
      new Table({
        name: 'task_categories',
        columns: [
          { name: 'task_id', type: 'uuid', isPrimary: true },
          { name: 'category_id', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    // 添加外键约束
    await queryRunner.createForeignKeys('task_tags', [
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedTableName: 'tasks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['tag_id'],
        referencedTableName: 'tags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('task_categories', [
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedTableName: 'tasks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_categories');
    await queryRunner.dropTable('task_tags');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('tags');
  }
}
