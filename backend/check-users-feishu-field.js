const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'agent_task_test',
  user: 'admin',
  password: 'admin123'
});

async function checkUsersFields() {
  try {
    // 检查users表的所有字段
    const columnsQuery = `
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(columnsQuery);
    
    console.log('=== Users table columns ===');
    result.rows.forEach(col => {
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      console.log(`  - ${col.column_name} (${type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 检查是否有feishu_open_id字段
    const hasFeishuField = result.rows.some(col => col.column_name === 'feishu_open_id');
    console.log('\n=== Check feishu_open_id field ===');
    console.log(hasFeishuField ? '✅ feishu_open_id field exists' : '❌ feishu_open_id field NOT exists');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersFields();
