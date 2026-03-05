const { Client } = require('pg');

async function verifyDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin123',
    database: 'agent_task',
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 验证agents表的新字段
    console.log('📋 验证agents表的新字段:');
    const agentsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'agents' 
      AND column_name IN ('api_token', 'api_token_hash', 'api_token_expires_at', 'last_api_access_at', 'role')
      ORDER BY column_name
    `);
    
    const expectedFields = ['api_token', 'api_token_hash', 'api_token_expires_at', 'last_api_access_at', 'role'];
    const foundFields = agentsColumns.rows.map(r => r.column_name);
    
    expectedFields.forEach(field => {
      const found = foundFields.includes(field);
      const col = agentsColumns.rows.find(r => r.column_name === field);
      if (found) {
        console.log(`  ✅ ${field}: ${col.data_type} (nullable: ${col.is_nullable})`);
      } else {
        console.log(`  ❌ ${field}: 未找到`);
      }
    });

    // 2. 验证api_access_logs表
    console.log('\n📋 验证api_access_logs表:');
    const logTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'api_access_logs'
      )
    `);
    
    if (logTableExists.rows[0].exists) {
      console.log('  ✅ api_access_logs表存在');
      
      const logColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'api_access_logs'
        ORDER BY ordinal_position
      `);
      
      logColumns.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('  ❌ api_access_logs表不存在');
    }

    // 3. 验证索引
    console.log('\n📋 验证索引:');
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('agents', 'api_access_logs')
      AND indexname LIKE '%api_token%' OR indexname LIKE '%agent_id%' OR indexname LIKE '%access%'
      ORDER BY tablename, indexname
    `);
    
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(`  ✅ ${idx.indexname}`);
      });
    } else {
      console.log('  ⚠️  未找到相关索引');
    }

    // 4. 检查现有agent的role字段
    console.log('\n📋 检查agents表的role字段值:');
    const agentsWithRole = await client.query(`
      SELECT id, name, role, api_token IS NOT NULL as has_token
      FROM agents
      LIMIT 5
    `);
    
    if (agentsWithRole.rows.length > 0) {
      agentsWithRole.rows.forEach(agent => {
        console.log(`  - ${agent.name}: role=${agent.role || 'NULL'}, has_token=${agent.has_token}`);
      });
    } else {
      console.log('  ⚠️  agents表中没有数据');
    }

    await client.end();
    console.log('\n✅ 数据库验证完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库验证失败:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
