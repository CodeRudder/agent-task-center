const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function createTaskDependenciesTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== Creating task_dependencies table ===');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        taskId UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        dependsOnTaskId UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        dependencyType VARCHAR(50) DEFAULT 'blocks',
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(taskId, dependsOnTaskId)
      );
    `);
    
    console.log('✅ task_dependencies table created successfully');
    
    // 验证表是否创建成功
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'task_dependencies';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification: task_dependencies table exists');
    } else {
      console.log('❌ Verification failed: task_dependencies table does NOT exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTaskDependenciesTable().catch(console.error);
