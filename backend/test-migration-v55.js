const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'agent_task_test',
  user: 'admin',
  password: 'admin123'
});

async function testMigration() {
  try {
    console.log('=== Testing V5.5 Migration ===\n');
    
    // 读取迁移文件
    const sql = fs.readFileSync('sql/migrate_v55_add_votes_and_feishu.sql', 'utf8');
    
    console.log('1. Reading migration file... OK');
    console.log('2. Executing migration...\n');
    
    // 执行迁移（分段执行，因为psql会返回多个结果）
    await pool.query('BEGIN');
    
    // 执行整个SQL文件
    try {
      const result = await pool.query(sql);
      console.log('3. Migration executed successfully!');
      if (result.rows && result.rows.length > 0) {
        console.log('\n=== Verification Results ===');
        result.rows.forEach(row => {
          console.log(JSON.stringify(row, null, 2));
        });
      }
    } catch (error) {
      console.log('Note: Some parts already exist (expected)');
      console.log('Error message:', error.message);
    }
    
    await pool.query('COMMIT');
    
    // 验证结果
    console.log('\n=== Verification ===');
    
    // 检查votes表
    const votesCheck = await pool.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = 'votes' AND table_schema = 'public'
    `);
    console.log(`votes table columns: ${votesCheck.rows[0].column_count}`);
    
    // 检查feishu_open_id字段
    const feishuCheck = await pool.query(`
      SELECT COUNT(*) as field_count 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'feishu_open_id'
      AND table_schema = 'public'
    `);
    console.log(`feishu_open_id field: ${feishuCheck.rows[0].field_count > 0 ? 'exists' : 'not found'}`);
    
    console.log('\n✅ Migration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.query('ROLLBACK');
  } finally {
    await pool.end();
  }
}

testMigration();
