/**
 * 任务管理API集成测试
 * 测试任务的CRUD操作、进度更新、状态管理等功能
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { APIUtils } from '../utils/api.utils';
import { config } from '../config/test.config';

describe('任务管理API集成测试', () => {
  let api: APIUtils;
  let testToken: string;
  let testUserId: string;
  let createdTaskId: string;

  beforeAll(async () => {
    api = new APIUtils();
    
    // 登录获取token
    const loginResult = await api.login();
    testToken = loginResult.token;
    testUserId = loginResult.user.id;
  });

  afterAll(async () => {
    api.logout();
  });

  describe('POST /tasks - 创建任务', () => {
    test('应该成功创建基础任务', async () => {
      const taskData = {
        title: '测试任务-基础',
        description: '这是一个基础测试任务',
        status: 'todo',
        priority: 'medium',
        progress: 0,
      };

      const response = await api.post('/tasks', taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe(taskData.title);

      createdTaskId = response.body.data.id;
    });

    test('应该成功创建完整任务', async () => {
      const taskData = {
        title: '测试任务-完整',
        description: '这是一个完整测试任务',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await api.post('/tasks', taskData);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.progress).toBe(taskData.progress);
    });

    test('应该拒绝缺少必填字段', async () => {
      const response = await api.post('/tasks', {
        // 缺少 title
        description: '缺少标题的任务',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝无效的status值', async () => {
      const response = await api.post('/tasks', {
        title: '测试任务',
        status: 'invalid_status',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝无效的priority值', async () => {
      const response = await api.post('/tasks', {
        title: '测试任务',
        priority: 'invalid_priority',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝超出范围的progress值', async () => {
      const response = await api.post('/tasks', {
        title: '测试任务',
        progress: 150, // 超出0-100范围
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /tasks - 查询任务列表', () => {
    test('应该成功获取任务列表', async () => {
      const response = await api.get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    test('应该支持按status过滤', async () => {
      const response = await api.get('/tasks', { status: 'todo' });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toBeDefined();
      // 验证返回的任务都是todo状态
      response.body.data.items.forEach((task: any) => {
        expect(task.status).toBe('todo');
      });
    });

    test('应该支持按priority过滤', async () => {
      const response = await api.get('/tasks', { priority: 'high' });

      expect(response.status).toBe(200);
      response.body.data.items.forEach((task: any) => {
        expect(task.priority).toBe('high');
      });
    });

    test('应该支持分页查询', async () => {
      const response = await api.get('/tasks', { page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    test('未登录应该返回401', async () => {
      api.logout();
      const response = await api.get('/tasks');

      expect(response.status).toBe(401);
      
      // 恢复登录
      await api.login();
    });
  });

  describe('GET /tasks/:id - 获取任务详情', () => {
    test('应该成功获取任务详情', async () => {
      const response = await api.get(`/tasks/${createdTaskId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(createdTaskId);
    });

    test('应该返回完整的任务信息', async () => {
      const response = await api.get(`/tasks/${createdTaskId}`);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('priority');
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    test('查询不存在的任务应该返回404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/tasks/${fakeId}`);

      expect(response.status).toBe(404);
    });

    test('无效的ID格式应该返回400', async () => {
      const response = await api.get('/tasks/invalid-id');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /tasks/:id - 更新任务', () => {
    test('应该成功更新任务标题', async () => {
      const newTitle = '更新后的任务标题';
      const response = await api.patch(`/tasks/${createdTaskId}`, {
        title: newTitle,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(newTitle);
    });

    test('应该成功更新任务状态', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}`, {
        status: 'in_progress',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('in_progress');
    });

    test('应该成功更新任务进度', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}`, {
        progress: 75,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(75);
    });

    test('应该支持同时更新多个字段', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}`, {
        status: 'completed',
        progress: 100,
        priority: 'urgent',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.progress).toBe(100);
      expect(response.body.data.priority).toBe('urgent');
    });
  });

  describe('PATCH /tasks/:id/progress - 更新任务进度', () => {
    test('应该成功更新进度到50%', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}/progress`, {
        progress: 50,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(50);
    });

    test('应该成功更新进度到100%', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}/progress`, {
        progress: 100,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(100);
    });

    test('应该拒绝负数进度', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}/progress`, {
        progress: -10,
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('应该拒绝超过100的进度', async () => {
      const response = await api.patch(`/tasks/${createdTaskId}/progress`, {
        progress: 150,
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /tasks/:id - 删除任务', () => {
    let taskToDelete: string;

    beforeEach(async () => {
      // 创建一个待删除的任务
      const response = await api.post('/tasks', {
        title: '待删除的任务',
        status: 'todo',
      });
      taskToDelete = response.body.data.id;
    });

    test('应该成功删除任务', async () => {
      const response = await api.delete(`/tasks/${taskToDelete}`);

      expect(response.status).toBe(200);

      // 验证任务已删除
      const getResponse = await api.get(`/tasks/${taskToDelete}`);
      expect(getResponse.status).toBe(404);
    });

    test('删除不存在的任务应该返回404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.delete(`/tasks/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('边界测试', () => {
    test('超长标题应该被限制', async () => {
      const longTitle = 'a'.repeat(500);
      const response = await api.post('/tasks', {
        title: longTitle,
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('特殊字符应该被正确处理', async () => {
      const response = await api.post('/tasks', {
        title: '测试任务 <script>alert("xss")</script>',
        description: '包含特殊字符的描述',
      });

      expect(response.status).toBe(201);
      // 验证特殊字符被转义或过滤
      expect(response.body.data.title).not.toContain('<script>');
    });

    test('空字符串字段应该被处理', async () => {
      const response = await api.post('/tasks', {
        title: '', // 空标题
        status: '',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
