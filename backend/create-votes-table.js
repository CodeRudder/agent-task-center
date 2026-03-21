/**
 * 创建votes表迁移脚本
 * 用于V5.5任务投票功能
 * 
 * 功能：在TEST环境中创建votes表及相关索引和外键约束
 * 
 * 执行方式：node create-votes-table.js
 */

const { Pool } = require('pg');

// 连接TEST环境数据库
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function createVotesTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== 开始创建votes表 ===\n');
    
    // 1. 检查votes表是否已存在
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'votes';
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('⚠️  votes表已存在，跳过创建');
      
      // 显示当前表结构
      const columnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'votes'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n当前表结构:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
      
      return;
    }
    
    // 2. 创建votes表
    console.log('📝 正在创建votes表...');
    await client.query(`
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
      );
    `);
    console.log('✅ votes表创建成功');
    
    // 3. 创建唯一索引（确保每个用户对每个任务只能投票一次）
    console.log('📝 正在创建唯一索引...');
    await client.query(`
      CREATE UNIQUE INDEX idx_votes_task_user ON votes(task_id, user_id);
    `);
    console.log('✅ 唯一索引创建成功');
    
    // 4. 验证创建结果
    console.log('\n=== 验证创建结果 ===');
    
    // 检查表是否存在
    const verifyTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'votes';
    `);
    
    if (verifyTable.rows.length > 0) {
      console.log('✅ votes表已成功创建');
    } else {
      throw new Error('votes表创建失败');
    }
    
    // 显示表结构
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'votes'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n表结构:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 检查索引
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'votes';
    `);
    
    console.log('\n索引:');
    indexResult.rows.forEach(row => {
      console.log(`- ${row.indexname}`);
    });
    
    // 检查外键
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'votes';
    `);
    
    console.log('\n外键约束:');
    fkResult.rows.forEach(row => {
      console.log(`- ${row.constraint_name}: ${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    console.log('\n✅ ✅ ✅ votes表创建完成！');
    console.log('\n下一步：通知Ops执行迁移（如果需要在生产环境执行）');
    
  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    console.error('详细信息:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行迁移
createVotesTable().catch(error => {
  console.error('\n❌ 迁移执行失败');
  process.exit(1);
});
