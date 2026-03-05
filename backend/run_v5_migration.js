const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin123',
    database: 'agent_task',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync('/tmp/v5_migration.sql', 'utf8');
    await client.query(sql);
    console.log('✅ V5 migration executed successfully');

    // 验证表结构
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agents' 
      AND column_name IN ('api_token', 'api_token_hash', 'api_token_expires_at', 'last_api_access_at', 'role')
      ORDER BY column_name
    `);
    
    console.log('\n📊 Agents table new columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // 验证api_access_logs表
    const logTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'api_access_logs'
      )
    `);
    console.log(`\n📊 api_access_logs table exists: ${logTable.rows[0].exists}`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
