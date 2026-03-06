const { Pool } = require('pg');

async function fixCommentsTable() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'agent_task',
    user: 'admin',
    password: 'admin123',
  });

  try {
    console.log('Dropping old comments table...');
    await pool.query('DROP TABLE IF EXISTS comments CASCADE;');
    console.log('✅ Old table dropped');

    console.log('Creating new comments table...');
    await pool.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL,
        task_id UUID NOT NULL REFERENCES tasks(id),
        author_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ New table created');

    // Verify table structure
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comments'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ Comments table fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixCommentsTable();
