import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingFields1709592000004 implements MigrationInterface {
  name = 'AddMissingFields1709592000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加task_templates.defaultPriority字段
    await queryRunner.query(`
      ALTER TABLE task_templates 
      ADD COLUMN IF NOT EXISTS "defaultPriority" VARCHAR(20) DEFAULT 'medium'
    `);

    // 2. 添加tasks.templateId字段
    await queryRunner.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS "templateId" UUID REFERENCES task_templates(id) ON DELETE SET NULL
    `);

    // 3. 为templateId创建索引以提高查询性能
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks("templateId") 
      WHERE "deletedAt" IS NULL
    `);

    // 4. 更新现有数据（如果有需要的话）
    // 将defaultPriority设置为默认值
    await queryRunner.query(`
      UPDATE task_templates 
      SET "defaultPriority" = 'medium' 
      WHERE "defaultPriority" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_template_id`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS "templateId"`);
    await queryRunner.query(`ALTER TABLE task_templates DROP COLUMN IF EXISTS "defaultPriority"`);
  }
}
