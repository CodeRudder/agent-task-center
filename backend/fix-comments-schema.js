const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function fixCommentsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking comments table schema ===');
    
    // 检查表结构
    const tableInfoResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'comments'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent columns:');
    tableInfoResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // 检查是否存在deleted_at字段
    const hasDeletedAt = tableInfoResult.rows.some(row => row.column_name === 'deleted_at');
    
    if (!hasDeletedAt) {
      console.log('\n❌ deleted_at field is missing. Adding...');
      
      await client.query(`
        ALTER TABLE comments
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
      `);
      
      console.log('✅ deleted_at field added successfully');
    } else {
      console.log('\n✅ deleted_at field already exists');
    }
    
    // 验证修复结果
    const verifyResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'comments' AND column_name = 'deleted_at';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('\n✅ Verification: deleted_at field exists');
      console.log('Type:', verifyResult.rows[0].data_type);
    } else {
      console.log('\n❌ Verification failed: deleted_at field not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixCommentsSchema().catch(console.error);
