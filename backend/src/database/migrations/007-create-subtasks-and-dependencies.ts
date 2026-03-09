import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSubtasksAndDependencies1709748000000 implements MigrationInterface {
  name = 'CreateSubtasksAndDependencies1709748000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subtasks table
    await queryRunner.createTable(
      new Table({
        name: 'subtasks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'task_id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'completed', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Create task_dependencies table
    await queryRunner.createTable(
      new Table({
        name: 'task_dependencies',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'task_id', type: 'uuid', isNullable: false },
          { name: 'depends_on_task_id', type: 'uuid', isNullable: false },
          { name: 'dependency_type', type: 'varchar', length: '20', default: 'blocking' },
          { name: 'is_blocking', type: 'boolean', default: true },
          { name: 'auto_resolve', type: 'boolean', default: false },
          { name: 'resolve_after_hours', type: 'int', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'subtasks',
      new TableForeignKey({
        name: 'FK_subtasks_task_id',
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'task_dependencies',
      new TableForeignKey({
        name: 'FK_task_dependencies_task_id',
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'task_dependencies',
      new TableForeignKey({
        name: 'FK_task_dependencies_depends_on_task_id',
        columnNames: ['depends_on_task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_dependencies');
    await queryRunner.dropTable('subtasks');
  }
}
