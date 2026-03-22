import { DataSource } from 'typeorm';
import { seedTestData } from './src/database/seeds/test-data.seed';

async function runSeed() {
  console.log('正在初始化数据源...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'admin',
    password: 'admin123',
    database: 'agent_task_test',
    synchronize: false,
    entities: ['src/**/*.entity.ts'],
  });

  await dataSource.initialize();
  console.log('数据源已初始化');

  try {
    console.log('开始运行种子数据脚本...');
    await seedTestData(dataSource);
    console.log('种子数据脚本运行完成');
  } catch (error) {
    console.error('运行种子数据脚本失败:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('数据源已关闭');
  }
}

runSeed().catch((error) => {
  console.error('执行种子数据脚本失败:', error);
  process.exit(1);
});
