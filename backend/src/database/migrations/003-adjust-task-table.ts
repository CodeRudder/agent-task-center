import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdjustTaskTable1709424000003 implements MigrationInterface {
  name = 'AdjustTaskTable1709424000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 先删除视图（因为它们依赖status列）
    await queryRunner.query(`DROP VIEW IF EXISTS v_agent_load`);
    await queryRunner.query(`DROP VIEW IF EXISTS v_task_statistics`);

    // 2. 添加缺失字段
    await queryRunner.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies UUID[] DEFAULT '{}';
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS params JSONB DEFAULT '{}';
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS result JSONB DEFAULT '{}';
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS creator_id UUID NOT NULL REFERENCES users(id);
    `);

    // 3. 修改状态枚举
    await queryRunner.query(`
      ALTER TABLE tasks ALTER COLUMN status TYPE VARCHAR(20);
      
      UPDATE tasks SET status = 'pending' WHERE status = 'todo';
      UPDATE tasks SET status = 'in_progress' WHERE status = 'in_progress';
      UPDATE tasks SET status = 'completed' WHERE status IN ('review', 'done');
      
      ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_task_status;
      ALTER TABLE tasks ADD CONSTRAINT chk_task_status
        CHECK (status IN ('pending', 'in_progress', 'completed', 'accepted', 'rejected'));
    `);

    // 4. 添加索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, "dueDate");
    `);

    // 5. 创建触发器
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
      CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
      CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
      CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // 6. 重新创建视图（使用新的枚举值）
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_task_statistics AS
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        AVG(progress) FILTER (WHERE status = 'in_progress') as avg_progress
      FROM tasks
      WHERE "deletedAt" IS NULL
      GROUP BY DATE("createdAt")
      ORDER BY date DESC;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_agent_load AS
      SELECT
        a.id,
        a.name,
        a.status,
        a.max_concurrent_tasks,
        COUNT(ta.id) as current_tasks,
        COUNT(ta.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
        ROUND(
          COUNT(ta.id)::DECIMAL / NULLIF(a.max_concurrent_tasks, 0) * 100,
          2
        ) as load_percentage
      FROM agents a
      LEFT JOIN task_assignments ta ON a.id = ta.agent_id
      LEFT JOIN tasks t ON ta.task_id = t.id AND t."deletedAt" IS NULL
      WHERE a.deleted_at IS NULL
      GROUP BY a.id, a.name, a.status, a.max_concurrent_tasks;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS v_agent_load`);
    await queryRunner.query(`DROP VIEW IF EXISTS v_task_statistics`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS category_id`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS dependencies`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS params`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS result`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS started_at`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS completed_at`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS accepted_at`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS creator_id`);
  }
}
