const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function testInsertVote() {
  const client = await pool.connect();
  
  try {
    const taskId = 'a9b0172a-88ed-4ea7-9f70-e184cd5d8155';
    const userId = 'ecd46e22-1a37-4604-be9f-68bae47a55a7';
    
    console.log('=== Testing manual vote insertion ===');
    
    // 手动插入一条投票数据
    const insertResult = await client.query(`
      INSERT INTO votes (id, "taskId", "userId", "voteType", "votedAt", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'upvote',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *;
    `, [taskId, userId]);
    
    console.log('✅ Vote inserted successfully!');
    console.log('Inserted vote:', insertResult.rows[0]);
    
    // 验证数据是否保存
    const verifyResult = await client.query('SELECT * FROM votes;');
    console.log(`\n✅ Total votes in database: ${verifyResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testInsertVote().catch(console.error);
