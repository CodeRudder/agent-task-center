/**
 * 测试配置文件
 * 用于API和UI测试的全局配置
 */

export const config = {
  // API配置
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5100',
    prefix: '/api/v1',
    timeout: 30000,
    
    // 测试账号
    testUser: {
      email: process.env.TEST_USER_EMAIL || 'test@test.com',
      password: process.env.TEST_USER_PASSWORD || 'test123',
    },
    
    // 管理员账号
    adminUser: {
      email: process.env.ADMIN_USER_EMAIL || 'admin@test.com',
      password: process.env.ADMIN_USER_PASSWORD || 'admin123',
    },
  },

  // UI配置
  ui: {
    baseUrl: process.env.UI_BASE_URL || 'http://localhost:5100',
    timeout: 30000,
    slowMo: 100, // 减慢操作速度（毫秒）
    headless: process.env.HEADLESS === 'true', // 是否无头模式
    screenshot: {
      enabled: true,
      path: './test-screenshots',
      onFailure: true,
    },
    video: {
      enabled: false,
      path: './test-videos',
    },
  },

  // 数据库配置（用于测试数据清理）
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'agent_task',
  },

  // 测试环境
  env: process.env.NODE_ENV || 'test',

  // 超时配置
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    veryLong: 60000,
  },

  // 重试配置
  retries: {
    count: 2,
    delay: 1000,
  },
};

// 导出类型
export type TestConfig = typeof config;
