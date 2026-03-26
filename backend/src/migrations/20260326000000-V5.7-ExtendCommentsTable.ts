import { MigrationInterface, QueryRunner } from 'typeorm';

export class V57ExtendCommentsTable1711430400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加is_edited字段
    await queryRunner.query(`
      ALTER TABLE comments
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
    `);

    // 添加parent_id字段
    await queryRunner.query(`
      ALTER TABLE comments
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
    `);

    // 创建索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_is_edited ON comments(is_edited);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`DROP INDEX IF EXISTS idx_comments_is_edited;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_comments_parent_id;`);

    // 删除字段
    await queryRunner.query(`ALTER TABLE comments DROP COLUMN IF EXISTS parent_id;`);
    await queryRunner.query(`ALTER TABLE comments DROP COLUMN IF EXISTS is_edited;`);
  }
}
