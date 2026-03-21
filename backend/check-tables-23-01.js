const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking all tables ===');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log(`\nTotal: ${result.rows.length} tables`);
    
    // 检查task_dependencies表是否存在
    const taskDepsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'task_dependencies';
    `);
    
    if (taskDepsResult.rows.length > 0) {
      console.log('\n✅ task_dependencies table exists');
    } else {
      console.log('\n❌ task_dependencies table does NOT exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables().catch(console.error);
