const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkColumns() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking tasks table columns ===');
    const tasksColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    
    tasksColumns.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n=== Checking users table columns ===');
    const usersColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    usersColumns.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns().catch(console.error);
