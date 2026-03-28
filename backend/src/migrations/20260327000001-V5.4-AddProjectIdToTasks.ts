import { MigrationInterface, QueryRunner } from 'typeorm';

export class V54AddProjectIdToTasks1711512000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 在tasks表中添加project_id字段
    await queryRunner.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS project_id UUID;
    `);

    // 2. 添加外键约束
    await queryRunner.query(`
      ALTER TABLE tasks
      ADD CONSTRAINT fk_tasks_project 
      FOREIGN KEY (project_id) 
      REFERENCES projects(id) 
      ON DELETE SET NULL;
    `);

    // 3. 创建索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    `);

    console.log('✅ V5.4 tasks表添加project_id字段成功');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：删除索引
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tasks_project_id;
    `);

    // 回滚：删除外键约束
    await queryRunner.query(`
      ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS fk_tasks_project;
    `);

    // 回滚：删除project_id字段
    await queryRunner.query(`
      ALTER TABLE tasks
      DROP COLUMN IF EXISTS project_id;
    `);

    console.log('✅ V5.4 tasks表删除project_id字段成功');
  }
}
