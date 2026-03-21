const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function listTables() {
  const client = await pool.connect();
  
  try {
    console.log('=== Listing all tables ===');
    
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
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

listTables().catch(console.error);
