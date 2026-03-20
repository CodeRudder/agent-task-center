const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'admin123',
  database: 'agent_task_test'
});

async function fixVotesTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== Fixing votes table column names ===\n');
    
    // 修改列名，从驼峰命名改为蛇形命名
    const renameMap = {
      'taskId': 'task_id',
      'userId': 'user_id',
      'voteType': 'vote_type',
      'votedAt': 'voted_at',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    };
    
    for (const [oldName, newName] of Object.entries(renameMap)) {
      try {
        await client.query(`
          ALTER TABLE votes 
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
    
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'votes'
      ORDER BY ordinal_position;
    `);
    
    console.log('Final columns:');
    columns.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    // 检查是否还有驼峰命名的列
    const camelCaseColumns = columns.rows.filter(row => 
      /[a-z][A-Z]/.test(row.column_name)
    );
    
    if (camelCaseColumns.length === 0) {
      console.log('\n✅ ✅ ✅ votes table fixed successfully! All columns are snake_case now.');
    } else {
      console.log('\n⚠️  Still have camelCase columns:', camelCaseColumns.map(r => r.column_name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixVotesTable().catch(console.error);
