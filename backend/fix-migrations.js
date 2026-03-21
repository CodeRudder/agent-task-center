const { DataSource } = require('typeorm');
require('dotenv').config();

async function fixMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'agent_task_system',
  });

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    // 检查migrations表是否存在
    const tableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    if (!tableCheck[0].exists) {
      console.log('❌ migrations表不存在，创建migrations表');
      await dataSource.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          timestamp BIGINT,
          name VARCHAR(255)
        );
      `);
    }

    // 清空migrations表
    await dataSource.query('TRUNCATE TABLE migrations CASCADE;');
    console.log('✅ 已清空migrations表');

    // 插入已执行的迁移记录
    const migrations = [
      { timestamp: 1709654400000, name: 'V5AgentApiIntegration' },
      { timestamp: 1709660400000, name: 'V5Phase2BCommentNotification' },
      { timestamp: 1690000000000, name: 'CreateNotificationsTable' },
      { timestamp: 20260308033100, name: 'CreateTaskStatusHistoriesTable' },
      { timestamp: 1709846400000, name: 'create-agent-token-fields' },
      { timestamp: 1709592000000, name: 'create-task-templates' },
      { timestamp: 20260304011200, name: 'V3.0.0-AddAgentManagementAndSubtasks' },
      { timestamp: 1773486191, name: 'add-tags-categories' },
    ];

    for (const migration of migrations) {
      await dataSource.query(
        'INSERT INTO migrations (timestamp, name) VALUES ($1, $2)',
        [migration.timestamp, migration.name]
      );
      console.log(`✅ 插入迁移记录: ${migration.name}`);
    }

    console.log('✅ 所有迁移记录已插入');

    // 验证
    const result = await dataSource.query('SELECT COUNT(*) FROM migrations');
    console.log(`✅ migrations表中记录数: ${result[0].count}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

fixMigrations().catch(console.error);
