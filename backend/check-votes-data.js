const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkVotesData() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking votes data ===');
    
    // 检查votes表中的数据
    const result = await client.query('SELECT * FROM votes;');
    
    if (result.rows.length > 0) {
      console.log(`✅ Found ${result.rows.length} vote(s)`);
      console.log('\nVote data:');
      result.rows.forEach((row, index) => {
        console.log(`\nVote ${index + 1}:`);
        console.log(`- id: ${row.id}`);
        console.log(`- taskId: ${row.taskId}`);
        console.log(`- userId: ${row.userId}`);
        console.log(`- voteType: ${row.voteType}`);
        console.log(`- votedAt: ${row.votedAt}`);
      });
    } else {
      console.log('❌ No votes found in the database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkVotesData().catch(console.error);
