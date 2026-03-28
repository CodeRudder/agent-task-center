import { registerAs } from '@nestjs/config';

const databaseConfig = registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'agent_task_system',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // 禁用自动建表，使用SQL脚本管理
}));

export default databaseConfig;
export { databaseConfig };
