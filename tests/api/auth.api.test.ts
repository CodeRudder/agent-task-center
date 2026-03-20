/**
 * 认证API集成测试
 * 测试用户注册、登录、token刷新等功能
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { APIUtils } from '../utils/api.utils';
import { config } from '../config/test.config';

describe('认证API集成测试', () => {
  let api: APIUtils;
  let testUser: { email: string; password: string; name: string };
  let testToken: string;
  let testUserId: string;

  beforeAll(() => {
    api = new APIUtils();
    testUser = {
      email: `test-auth-${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: '认证测试用户',
    };
  });

  afterAll(async () => {
    api.logout();
  });

  describe('POST /auth/register - 用户注册', () => {
    test('应该成功注册新用户', async () => {
      const response = await api.register(testUser);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.user.email).toBe(testUser.email);
      expect(response.user.name).toBe(testUser.name);

      testToken = response.token;
      testUserId = response.user.id;
    });

    test('应该拒绝重复注册相同邮箱', async () => {
      const response = await api.post('/auth/register', testUser);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    test('应该拒绝无效的邮箱格式', async () => {
      const response = await api.post('/auth/register', {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: '测试用户',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝弱密码', async () => {
      const response = await api.post('/auth/register', {
        email: `test-weak-${Date.now()}@example.com`,
        password: '123',
        name: '测试用户',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝缺少必填字段', async () => {
      const response = await api.post('/auth/register', {
        email: `test-missing-${Date.now()}@example.com`,
        // 缺少 password
        name: '测试用户',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/login - 用户登录', () => {
    test('应该成功登录', async () => {
      const response = await api.login(testUser.email, testUser.password);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.user.email).toBe(testUser.email);
    });

    test('应该拒绝错误的密码', async () => {
      const response = await api.post('/auth/login', {
        email: testUser.email,
        password: 'wrong-password',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    test('应该拒绝不存在的用户', async () => {
      const response = await api.post('/auth/login', {
        email: `nonexistent-${Date.now()}@example.com`,
        password: 'Test123!@#',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝缺少必填字段', async () => {
      const response = await api.post('/auth/login', {
        email: testUser.email,
        // 缺少 password
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /auth/profile - 获取用户信息', () => {
    test('应该成功获取当前用户信息', async () => {
      api.setToken(testToken);
      const response = await api.get('/auth/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.id).toBe(testUserId);
    });

    test('未登录应该返回401', async () => {
      api.logout();
      const response = await api.get('/auth/profile');

      expect(response.status).toBe(401);
    });

    test('无效token应该返回401', async () => {
      api.setToken('invalid-token');
      const response = await api.get('/auth/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('Token验证', () => {
    test('Bearer token格式应该正确', () => {
      expect(testToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    test('token应该包含用户信息', () => {
      // JWT token的payload部分是base64编码的
      const payload = testToken.split('.')[1];
      const decoded = Buffer.from(payload, 'base64').toString();
      const data = JSON.parse(decoded);

      expect(data).toBeDefined();
      expect(data.email).toBeDefined();
      expect(data.sub).toBeDefined();
    });
  });

  describe('边界测试', () => {
    test('超长邮箱应该被拒绝', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      const response = await api.post('/auth/register', {
        email: longEmail,
        password: 'Test123!@#',
        name: '测试用户',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('超长密码应该被限制', async () => {
      const longPassword = 'a'.repeat(200);
      const response = await api.post('/auth/register', {
        email: `test-long-pwd-${Date.now()}@example.com`,
        password: longPassword,
        name: '测试用户',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('特殊字符邮箱应该被处理', async () => {
      const response = await api.post('/auth/register', {
        email: 'test+special@example.com',
        password: 'Test123!@#',
        name: '测试用户',
      });

      // 视具体实现而定，可能成功或失败
      expect([200, 201, 400]).toContain(response.status);
    });
  });
});
