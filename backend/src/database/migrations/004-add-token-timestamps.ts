import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenTimestamps1741240000004 implements MigrationInterface {
  name = 'AddTokenTimestamps1741240000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加token时间戳字段到agents表
    await queryRunner.query(`
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP;
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除token时间戳字段
    await queryRunner.query(`
      ALTER TABLE agents DROP COLUMN IF EXISTS token_created_at;
      ALTER TABLE agents DROP COLUMN IF EXISTS token_expires_at;
    `);
  }
}
