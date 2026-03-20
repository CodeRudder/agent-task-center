const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function checkV55Tables() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking V5.5 tables status ===\n');
    
    const tablesToCheck = [
      'votes',
      'task_dependencies',
      'task_status_histories',
      'task_templates',
      'agent_stats',
      'api_access_logs',
      'notifications'
    ];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Checking table: ${tableName}`);
      
      // 检查表是否存在
      const tableExists = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1;
      `, [tableName]);
      
      if (tableExists.rows.length === 0) {
        console.log(`  ❌ Table does NOT exist`);
        continue;
      }
      
      console.log(`  ✅ Table exists`);
      
      // 检查列名
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log(`  📊 Columns (${columns.rows.length} total):`);
      columns.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`    - ${row.column_name} (${row.data_type}) ${nullable}`);
      });
      
      // 检查是否有驼峰命名的列（需要修复）
      const camelCaseColumns = columns.rows.filter(row => 
        /[a-z][A-Z]/.test(row.column_name)
      );
      
      if (camelCaseColumns.length > 0) {
        console.log(`  ⚠️  Found camelCase columns (need fix):`);
        camelCaseColumns.forEach(row => {
          console.log(`    - ${row.column_name}`);
        });
      } else {
        console.log(`  ✅ All columns are snake_case (fixed)`);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ votes: Fixed (22:08)');
    console.log('✅ task_dependencies: Fixed (23:06)');
    console.log('🔄 task_status_histories: Check above');
    console.log('📋 task_templates: Check above');
    console.log('📋 agent_stats: Check above');
    console.log('📋 api_access_logs: Check above');
    console.log('📋 notifications: Check above');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkV55Tables().catch(console.error);
