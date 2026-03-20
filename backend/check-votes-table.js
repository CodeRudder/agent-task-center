const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkVotesTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking votes table ===');
    
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'votes';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ votes table exists');
      
      const columnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'votes'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nColumns:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ votes table does NOT exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkVotesTable().catch(console.error);
