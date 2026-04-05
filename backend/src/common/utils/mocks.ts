/**
 * 统一的测试Mock工具
 * 用于减少重复代码，提高测试修复效率
 */
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Mock Repository
 * 用于模拟TypeORM Repository的基本方法
 */
export const mockRepository = () => ({
  find: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  softDelete: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  count: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(),
});

/**
 * Mock DataSource
 * 用于模拟TypeORM DataSource
 */
export const MockDataSource = {
  createQueryRunner: jest.fn(),
  manager: jest.fn(),
  transaction: jest.fn().mockImplementation(async (callback: any) => {
    // 默认实现：返回一个基本的query runner mock
    return callback({
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entity: any) => entity),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn(),
      delete: jest.fn(),
    } as any);
  }),
} as any;

/**
 * Mock JwtService
 * 用于模拟JWT服务
 */
export const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('test-access-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
  decode: jest.fn(),
}) as any;

/**
 * Mock Service
 * 通用的Service mock
 */
export const mockService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

/**
 * 获取Repository Token的Mock
 * 用于TypeORM的getRepositoryToken
 */
export const getMockRepositoryToken = (entity: any) => {
  return `MockRepository_${entity.name}`;
};

/**
 * Mock Logger
 * 用于模拟NestJS Logger
 */
export const mockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Mock ConfigService
 * 用于模拟配置服务
 */
export const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config: any = {
      'JWT_SECRET': 'test-secret',
      'JWT_EXPIRES_IN': '1h',
      'DATABASE_HOST': 'localhost',
      'DATABASE_PORT': 5432,
    };
    return config[key] || null;
  }),
}) as any;

/**
 * 便捷方法：创建完整的TestingModule配置
 * 用于快速配置测试模块
 */
export const createMockTestingModuleOptions = (options: {
  providers?: any[];
  controllers?: any[];
  imports?: any[];
}) => {
  const { providers = [], controllers = [], imports = [] } = options;

  return {
    providers: [
      ...providers,
      // 添加常用的mock providers
      { provide: DataSource, useValue: MockDataSource },
      { provide: JwtService, useValue: mockJwtService() },
      { provide: ConfigService, useValue: mockConfigService() },
    ],
    controllers,
    imports,
  };
};
