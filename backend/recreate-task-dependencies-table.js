const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function recreateTaskDependenciesTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== Recreating task_dependencies table ===');
    
    // 删除旧表
    await client.query('DROP TABLE IF EXISTS task_dependencies;');
    console.log('✅ Old table dropped');
    
    // 重新创建表，使用蛇形命名
    await client.query(`
      CREATE TABLE task_dependencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        dependency_type VARCHAR(50) DEFAULT 'blocks',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, depends_on_task_id)
      );
    `);
    
    console.log('✅ task_dependencies table created with snake_case naming');
    
    // 验证表是否创建成功
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'task_dependencies'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recreateTaskDependenciesTable().catch(console.error);
