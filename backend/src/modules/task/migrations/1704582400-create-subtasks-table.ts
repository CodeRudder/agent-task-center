import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubtasksTable1704582400 implements MigrationInterface {
  name = 'CreateSubtasksTable1704582400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types first
    await queryRunner.createEnumType('subtasks_status_enum', ['todo', 'in_progress', 'review', 'done', 'blocked']);
    await queryRunner.createEnumType('subtasks_priority_enum', ['low', 'medium', 'high', 'urgent']);

    await queryRunner.createTable('subtasks', new Table({
      name: 'subtasks',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
        },
        {
          name: 'title',
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
          name: 'progress',
          type: 'int',
          default: 0,
          isNullable: false,
        },
        {
          name: 'status',
          type: 'enum',
          enumName: 'subtasks_status_enum',
          default: "'todo'",
          isNullable: false,
        },
        {
          name: 'priority',
          type: 'enum',
          enumName: 'subtasks_priority_enum',
          default: "'medium'",
          isNullable: false,
        },
        {
          name: 'due_date',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'assigned_to_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'completed_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'created_by',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'updated_by',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'parent_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'task_id',
          type: 'uuid',
          isNullable: false,
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
        {
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        },
      ],
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('subtasks', 'users', ['assigned_to_id'], ['id'], {
      name: 'fk_subtasks_assigned_to',
      onDelete: 'SET NULL',
    });

    await queryRunner.createForeignKey('subtasks', 'users', ['created_by'], ['id'], {
      name: 'fk_subtasks_created_by',
      onDelete: 'CASCADE',
    });

    await queryRunner.createForeignKey('subtasks', 'users', ['updated_by'], ['id'], {
      name: 'fk_subtasks_updated_by',
      onDelete: 'SET NULL',
    });

    await queryRunner.createForeignKey('subtasks', 'tasks', ['task_id'], ['id'], {
      name: 'fk_subtasks_task',
      onDelete: 'CASCADE',
    });

    await queryRunner.createForeignKey('subtasks', 'tasks', ['parent_id'], ['id'], {
      name: 'fk_subtasks_parent',
      onDelete: 'CASCADE',
    });

    // Create indexes
    await queryRunner.createIndex('subtasks', ['task_id']);
    await queryRunner.createIndex('subtasks', ['parent_id', 'deleted_at']);
    await queryRunner.createIndex('subtasks', ['created_by']);
    await queryRunner.createIndex('subtasks', ['assigned_to_id']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('subtasks', ['assigned_to_id']);
    await queryRunner.dropIndex('subtasks', ['created_by']);
    await queryRunner.dropIndex('subtasks', ['parent_id', 'deleted_at']);
    await queryRunner.dropIndex('subtasks', ['task_id']);

    await queryRunner.dropForeignKey('subtasks', 'fk_subtasks_parent');
    await queryRunner.dropForeignKey('subtasks', 'fk_subtasks_task');
    await queryRunner.dropForeignKey('subtasks', 'fk_subtasks_updated_by');
    await queryRunner.dropForeignKey('subtasks', 'fk_subtasks_created_by');

    await queryRunner.dropTable('subtasks');

    await queryRunner.dropEnumType('subtasks_priority_enum');
    await queryRunner.dropEnumType('subtasks_status_enum');
  }
}
