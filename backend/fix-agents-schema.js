const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test',
});

async function fixAgentsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Starting agents table schema fix...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'fix-agents-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL
    await client.query(sql);
    
    console.log('✅ Agents table schema fixed successfully!');
    
    // Verify changes
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'agents' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent agents table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing agents table schema:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixAgentsSchema().catch(console.error);
