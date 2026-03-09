import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from "typeorm";

export class CreateTaskStatusHistoriesTable20260308033100 implements MigrationInterface {
  name = "CreateTaskStatusHistoriesTable20260308033100";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建状态变更历史表
    await queryRunner.query(`
      CREATE TABLE task_status_histories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        old_status VARCHAR(20) NOT NULL CHECK (old_status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
        new_status VARCHAR(20) NOT NULL CHECK (new_status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
        changed_by UUID NOT NULL,
        changed_by_type VARCHAR(20) NOT NULL CHECK (changed_by_type IN ('user', 'agent')),
        reason TEXT,
        changed_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_status_history_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `);

    // 创建索引
    await queryRunner.query(`
      CREATE INDEX idx_status_history_task ON task_status_histories(task_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_status_history_time ON task_status_histories(changed_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_status_history_user ON task_status_histories(changed_by, changed_by_type);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_status_history_task_time ON task_status_histories(task_id, changed_at DESC);
    `);

    // 添加注释
    await queryRunner.query(`
      COMMENT ON TABLE task_status_histories IS '任务状态变更历史表';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN task_status_histories.old_status IS '变更前状态';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN task_status_histories.new_status IS '变更后状态';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN task_status_histories.changed_by_type IS '变更人类型：user-用户, agent-Agent';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN task_status_histories.reason IS '变更原因（可选）';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`DROP INDEX IF EXISTS idx_status_history_task_time;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_status_history_user;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_status_history_time;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_status_history_task;`);

    // 删除表
    await queryRunner.query(`DROP TABLE IF EXISTS task_status_histories;`);
  }
}
