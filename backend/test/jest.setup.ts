import { config } from 'dotenv';

// 根据环境加载不同的配置文件
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

// 尝试加载环境变量文件
const result = config({ path: envFile });

if (result.error) {
  // 如果.env.test不存在，尝试使用.env
  config({ path: '.env' });
}

// 设置测试超时时间（QA环境需要更长超时）
jest.setTimeout(60000);

// 全局测试设置
console.log(`Test environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

