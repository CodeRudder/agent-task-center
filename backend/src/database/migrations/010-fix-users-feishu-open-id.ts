import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 修复users表缺少feishu_open_id字段的问题
 * 这个迁移脚本是幂等的，可以安全地多次执行
 * 
 * 背景：
 * - 迁移脚本008中定义了feishu_open_id字段
 * - 但TEST环境数据库可能缺少这个字段（迁移未执行或失败）
 * - 导致用户注册失败
 */
export class FixUsersFeishuOpenId1709739200001 implements MigrationInterface {
  name = 'FixUsersFeishuOpenId1709739200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查feishu_open_id列是否存在
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'feishu_open_id'
    `);

    // 如果列不存在，则添加
    if (!columnExists || columnExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN feishu_open_id VARCHAR(255) UNIQUE
      `);
      
      console.log('✅ Added feishu_open_id column to users table');
    } else {
      console.log('ℹ️  feishu_open_id column already exists in users table');
    }

    // 检查索引是否存在
    const indexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname = 'idx_users_feishu_open_id'
    `);

    // 如果索引不存在，则创建
    if (!indexExists || indexExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX idx_users_feishu_open_id ON users(feishu_open_id)
      `);
      
      console.log('✅ Created index idx_users_feishu_open_id');
    } else {
      console.log('ℹ️  Index idx_users_feishu_open_id already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_feishu_open_id
    `);
    
    // 删除列
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS feishu_open_id
    `);
    
    console.log('✅ Removed feishu_open_id column and index from users table');
  }
}
