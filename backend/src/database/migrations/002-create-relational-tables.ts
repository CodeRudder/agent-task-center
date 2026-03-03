import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRelationalTables1709424000002 implements MigrationInterface {
  name = 'CreateRelationalTables1709424000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建task_assignments表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id),
        role VARCHAR(20) DEFAULT 'owner' CHECK (role IN ('owner', 'collaborator')),
        assigned_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(task_id, agent_id)
      );

      CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
      CREATE INDEX idx_task_assignments_agent_id ON task_assignments(agent_id);
      CREATE INDEX idx_task_assignments_role ON task_assignments(role);
    `);

    // 2. 创建task_tags表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES tags(id),
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(task_id, tag_id)
      );

      CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
      CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
    `);

    // 3. 创建comments表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('user', 'agent')),
        author_id UUID NOT NULL,
        parent_id UUID REFERENCES comments(id),
        mentions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_comments_task_id ON comments(task_id);
      CREATE INDEX idx_comments_author_id ON comments(author_id);
      CREATE INDEX idx_comments_parent_id ON comments(parent_id);
      CREATE INDEX idx_comments_deleted_at ON comments(deleted_at);
    `);

    // 4. 创建attachments表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        storage_path VARCHAR(500) NOT NULL,
        url VARCHAR(500),
        uploader_type VARCHAR(20) NOT NULL CHECK (uploader_type IN ('user', 'agent')),
        uploader_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_attachments_task_id ON attachments(task_id);
      CREATE INDEX idx_attachments_deleted_at ON attachments(deleted_at);
    `);

    // 5. 创建视图（使用正确的列名和枚举值）
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_task_statistics AS
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'todo') as pending_tasks,
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
    await queryRunner.query(`DROP TABLE IF EXISTS attachments`);
    await queryRunner.query(`DROP TABLE IF EXISTS comments`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_assignments`);
  }
}
