const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function fixTaskStatusHistoriesColumns() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking task_status_histories table ===');
    
    // 检查表结构
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'task_status_histories'
      ORDER by ordinal_position;
    `);
    
    console.log('Current columns:');
    columns.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n=== Fixing column names ===');
    
    // 修改列名，从驼峰命名改为蛇形命名
    const renameMap = {
      'taskId': 'task_id',
      'fromStatus': 'from_status',
      'toStatus': 'to_status',
      'changeReason': 'change_reason',
      'changerId': 'changer_id',
      'changerName': 'changer_name',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'deletedAt': 'deleted_at'
    };
    
    for (const [oldName, newName] of Object.entries(renameMap)) {
      try {
        await client.query(`
          ALTER TABLE task_status_histories 
          RENAME COLUMN "${oldName}" TO ${newName};
        `);
        console.log(`✅ Renamed ${oldName} → ${newName}`);
      } catch (error) {
        if (error.code === '42703') {
          console.log(`⏭️  Column ${oldName} does not exist, skipping`);
        } else if (error.code === '42701') {
          console.log(`✅ Column ${newName} already exists`);
        } else {
          console.error(`❌ Error renaming ${oldName}: ${error.message}`);
        }
      }
    }
    
    console.log('\n=== Verification ===');
    
    const finalColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'task_status_histories'
      ORDER BY ordinal_position;
    `);
    
    console.log('Final columns:');
    finalColumns.rows.forEach(row => {
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

fixTaskStatusHistoriesColumns().catch(console.error);
