import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 创建votes表迁移脚本
 * 用于V5.5任务投票功能
 * 
 * 功能：创建votes表及相关索引和外键约束
 * 
 * 幂等性：这个迁移脚本是幂等的，可以安全地多次执行
 */
export class CreateVotesTable1710993600000 implements MigrationInterface {
  name = 'CreateVotesTable1710993600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 检查votes表是否已存在
    const tableExists = await queryRunner.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'votes'
    `);

    if (tableExists && tableExists.length > 0) {
      console.log('ℹ️  votes table already exists, skipping creation');
      return;
    }

    // 2. 创建votes表
    await queryRunner.query(`
      CREATE TABLE votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        user_id UUID NOT NULL,
        vote_type VARCHAR(10) NOT NULL DEFAULT 'upvote',
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_votes_task FOREIGN KEY (task_id) 
          REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_votes_user FOREIGN KEY (user_id) 
          REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_vote_type CHECK (vote_type IN ('upvote', 'downvote'))
      )
    `);
    console.log('✅ Created votes table');

    // 3. 创建唯一索引（确保每个用户对每个任务只能投票一次）
    const indexExists = await queryRunner.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'votes' AND indexname = 'idx_votes_task_user'
    `);

    if (!indexExists || indexExists.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX idx_votes_task_user ON votes(task_id, user_id)
      `);
      console.log('✅ Created unique index idx_votes_task_user');
    } else {
      console.log('ℹ️  Index idx_votes_task_user already exists');
    }

    // 4. 创建性能优化索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_task_id ON votes(task_id)
    `);
    console.log('✅ Created index idx_votes_task_id');

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id)
    `);
    console.log('✅ Created index idx_votes_user_id');

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at)
    `);
    console.log('✅ Created index idx_votes_created_at');

    console.log('✅ ✅ ✅ votes table migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votes_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votes_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votes_task_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votes_task_user`);
    
    // 删除表
    await queryRunner.query(`DROP TABLE IF EXISTS votes`);
    
    console.log('✅ Removed votes table and indexes');
  }
}
