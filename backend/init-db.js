const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_DATABASE || 'agent_task',
  entities: ['src/**/*.entity{.ts,.js}'],
  synchronize: true,
});

async function initDatabase() {
  try {
    await dataSource.initialize();
    console.log('Database synchronized successfully');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

initDatabase();
