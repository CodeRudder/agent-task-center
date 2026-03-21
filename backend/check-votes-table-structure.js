const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkVotesTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking votes table structure ===');
    
    // 检查表结构
    const structureResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns
      WHERE table_name = 'votes'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== Table columns ===');
    structureResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    // 检查外键约束
    const constraintResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'votes';
    `);
    
    console.log('\n=== Constraints ===');
    if (constraintResult.rows.length > 0) {
      constraintResult.rows.forEach(row => {
        console.log(`- ${row.constraint_name} (${row.constraint_type})`);
        if (row.foreign_table_name) {
          console.log(`  → ${row.column_name} references ${row.foreign_table_name}.${row.foreign_column_name}`);
        }
      });
    } else {
      console.log('No constraints found');
    }
    
    // 检查索引
    const indexResult = await client.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'votes';
    `);
    
    console.log('\n=== Indexes ===');
    if (indexResult.rows.length > 0) {
      indexResult.rows.forEach(row => {
        console.log(`- ${row.indexname}`);
      });
    } else {
      console.log('No indexes found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkVotesTableStructure().catch(console.error);
