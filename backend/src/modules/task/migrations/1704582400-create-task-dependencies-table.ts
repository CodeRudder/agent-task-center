import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTaskDependenciesTable1704582400 implements MigrationInterface {
  name = 'CreateTaskDependenciesTable1704582400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types first
    await queryRunner.createEnumType('task_dependencies_type_enum', [
      'blocking',
      'sequential',
      'parallel',
      'optional',
    ]);

    await queryRunner.createTable('task_dependencies', new Table({
      name: 'task_dependencies',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
        },
        {
          name: 'task_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'depends_on_task_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'dependency_type',
          type: 'enum',
          enumName: 'task_dependencies_type_enum',
          default: "'blocking'",
          isNullable: false,
        },
        {
          name: 'is_blocking',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'auto_resolve',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'resolve_after_hours',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'now()',
          isNullable: false,
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'now()',
          isNullable: false,
        },
      ],
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('task_dependencies', 'tasks', ['task_id'], ['id'], {
      name: 'fk_task_dependencies_task',
      onDelete: 'CASCADE',
    });

    await queryRunner.createForeignKey('task_dependencies', 'tasks', ['depends_on_task_id'], ['id'], {
      name: 'fk_task_dependencies_depends_on',
      onDelete: 'CASCADE',
    });

    // Create indexes
    await queryRunner.createIndex('task_dependencies', ['task_id', 'depends_on_task_id']);
    await queryRunner.createIndex('task_dependencies', ['depends_on_task_id', 'dependency_type']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('task_dependencies', ['depends_on_task_id', 'dependency_type']);
    await queryRunner.dropIndex('task_dependencies', ['task_id', 'depends_on_task_id']);

    await queryRunner.dropForeignKey('task_dependencies', 'fk_task_dependencies_depends_on');
    await queryRunner.dropForeignKey('task_dependencies', 'fk_task_dependencies_task');

    await queryRunner.dropTable('task_dependencies');

    await queryRunner.dropEnumType('task_dependencies_type_enum');
  }
}
