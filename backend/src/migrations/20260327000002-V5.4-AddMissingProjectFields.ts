import { MigrationInterface, QueryRunner } from 'typeorm';

export class V54AddMissingProjectFields1711512000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 为projects表添加status字段
    await queryRunner.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));
    `);

    // 2. 为projects表添加start_date字段
    await queryRunner.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS start_date DATE;
    `);

    // 3. 为projects表添加end_date字段
    await queryRunner.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS end_date DATE;
    `);

    // 4. 修改projects表的name字段长度为255
    await queryRunner.query(`
      ALTER TABLE projects 
      ALTER COLUMN name TYPE VARCHAR(255);
    `);

    // 5. 为project_members表添加created_at字段
    await queryRunner.query(`
      ALTER TABLE project_members 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);

    // 6. 为project_members表添加updated_at字段
    await queryRunner.query(`
      ALTER TABLE project_members 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    console.log('✅ V5.4迁移：添加缺失的项目字段成功');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：删除projects表的status字段
    await queryRunner.query(`
      ALTER TABLE projects 
      DROP COLUMN IF EXISTS status;
    `);

    // 回滚：删除projects表的start_date字段
    await queryRunner.query(`
      ALTER TABLE projects 
      DROP COLUMN IF EXISTS start_date;
    `);

    // 回滚：删除projects表的end_date字段
    await queryRunner.query(`
      ALTER TABLE projects 
      DROP COLUMN IF EXISTS end_date;
    `);

    // 回滚：恢复projects表的name字段长度为100
    await queryRunner.query(`
      ALTER TABLE projects 
      ALTER COLUMN name TYPE VARCHAR(100);
    `);

    // 回滚：删除project_members表的created_at字段
    await queryRunner.query(`
      ALTER TABLE project_members 
      DROP COLUMN IF EXISTS created_at;
    `);

    // 回滚：删除project_members表的updated_at字段
    await queryRunner.query(`
      ALTER TABLE project_members 
      DROP COLUMN IF EXISTS updated_at;
    `);

    console.log('✅ V5.4迁移回滚：删除添加的项目字段成功');
  }
}
