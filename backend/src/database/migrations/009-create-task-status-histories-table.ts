import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskStatusHistoriesTable1709654400001 implements MigrationInterface {
  name = 'CreateTaskStatusHistoriesTable1709654400001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建enum类型（如果不存在）
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tasks_status_enum AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE task_status_history_changed_by_type_enum AS ENUM ('user', 'agent');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建task_status_histories表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_status_histories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        old_status tasks_status_enum NOT NULL,
        new_status tasks_status_enum NOT NULL,
        changed_by TEXT,
        changed_by_type task_status_history_changed_by_type_enum NOT NULL,
        reason TEXT,
        changed_at TIMESTAMP NOT NULL,
        changer_name TEXT,
        changer_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_status_histories_task
          FOREIGN KEY (task_id) 
          REFERENCES tasks(id) 
          ON DELETE CASCADE
      );
    `);

    // 创建索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_task_status_histories_task_id_changed_at 
      ON task_status_histories(task_id, changed_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_task_status_histories_task_id_changed_at;
    `);

    // 删除表
    await queryRunner.query(`
      DROP TABLE IF EXISTS task_status_histories;
    `);

    // 删除enum类型
    await queryRunner.query(`
      DROP TYPE IF EXISTS task_status_history_changed_by_type_enum;
    `);
  }
}
