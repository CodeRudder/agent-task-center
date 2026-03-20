const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkForeignKeysFixed() {
  const client = await pool.connect();
  
  try {
    const taskId = 'a9b0172a-88ed-4ea7-9f70-e184cd5d8155';
    const userId = 'ecd46e22-1a37-4604-be9f-68bae47a55a7';
    
    console.log('=== Checking foreign keys ===');
    
    // 检查taskId是否存在
    const taskResult = await client.query(
      'SELECT id, title FROM tasks WHERE id = $1;',
      [taskId]
    );
    
    if (taskResult.rows.length > 0) {
      console.log(`✅ Task exists: ${taskResult.rows[0].title} (${taskId})`);
    } else {
      console.log(`❌ Task does NOT exist: ${taskId}`);
    }
    
    // 检查userId是否存在（使用正确的列名：display_name）
    const userResult = await client.query(
      'SELECT id, email, display_name FROM users WHERE id = $1;',
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      console.log(`✅ User exists: ${userResult.rows[0].display_name} (${userResult.rows[0].email})`);
    } else {
      console.log(`❌ User does NOT exist: ${userId}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkForeignKeysFixed().catch(console.error);
