import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskTemplates1709592000005 implements MigrationInterface {
  name = 'CreateTaskTemplates1709592000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查task_templates表是否已存在
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task_templates'
      );
    `);

    if (!tableExists[0].exists) {
      // 创建task_templates表
      await queryRunner.query(`
        CREATE TABLE task_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'general',
          "defaultPriority" VARCHAR(20) DEFAULT 'medium',
          "defaultTitle" TEXT,
          "defaultDescription" TEXT,
          "defaultMetadata" JSONB,
          tags JSONB,
          "estimatedMinutes" INTEGER DEFAULT 0,
          "usageCount" INTEGER DEFAULT 0,
          "isActive" BOOLEAN DEFAULT true,
          "created_by" UUID NOT NULL,
          "created_at" TIMESTAMP DEFAULT NOW(),
          "updated_at" TIMESTAMP DEFAULT NOW(),
          "deleted_at" TIMESTAMP,
          CONSTRAINT fk_template_creator FOREIGN KEY ("created_by") REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // 创建索引
      await queryRunner.query(`
        CREATE INDEX idx_task_templates_category ON task_templates(category) WHERE "deleted_at" IS NULL;
        CREATE INDEX idx_task_templates_created_by ON task_templates("created_by") WHERE "deleted_at" IS NULL;
        CREATE INDEX idx_task_templates_name ON task_templates USING gin(to_tsvector('english', name));
        CREATE INDEX idx_task_templates_is_active ON task_templates("isActive") WHERE "deleted_at" IS NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_task_templates_is_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_task_templates_name`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_task_templates_created_by`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_task_templates_category`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_templates`);
  }
}
