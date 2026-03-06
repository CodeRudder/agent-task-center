import { Test, TestingModule } from '@nestjs/testing';
import { GetTasksController } from '../../../../src/modules/agents/tasks/get-tasks.controller';
import { TaskService } from '../../../../src/modules/task/task.service';

describe('GetTasksController', () => {
  let controller: GetTasksController;
  let taskService: TaskService;

  const mockTaskService = {
    findAll: jest.fn(),
  };

  const mockApiTokenService = {
    validateApiToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetTasksController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        AgentAuthGuard,
        {
          provide: ApiTokenService,
          useValue: mockApiTokenService,
        },
      ],
    }).compile();

    controller = module.get<GetTasksController>(GetTasksController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return paginated tasks successfully', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo', priority: 'medium' },
        { id: '2', title: 'Task 2', status: 'in_progress', priority: 'high' },
      ];
      const mockResult = {
        data: mockTasks,
        total: 2,
      };

      mockTaskService.findAll.mockResolvedValue(mockResult);

      const req = { agent: { agentId: 'agent-123' } };
      const query = { page: 1, pageSize: 10 };

      const result = await controller.getTasks(query, req);

      expect(taskService.findAll).toHaveBeenCalledWith({
        assigneeId: 'agent-123',
        skip: 0,
        take: 10,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 2,
      });
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo', priority: 'medium' },
      ];
      const mockResult = { data: mockTasks, total: 1 };

      mockTaskService.findAll.mockResolvedValue(mockResult);

      const req = { agent: { agentId: 'agent-123' } };
      const query = { status: 'todo', page: 1, pageSize: 10 };

      const result = await controller.getTasks(query, req);

      expect(taskService.findAll).toHaveBeenCalledWith({
        assigneeId: 'agent-123',
        status: 'todo',
        skip: 0,
        take: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo', priority: 'urgent' },
      ];
      const mockResult = { data: mockTasks, total: 1 };

      mockTaskService.findAll.mockResolvedValue(mockResult);

      const req = { agent: { agentId: 'agent-123' } };
      const query = { priority: 'urgent', page: 1, pageSize: 10 };

      const result = await controller.getTasks(query, req);

      expect(taskService.findAll).toHaveBeenCalledWith({
        assigneeId: 'agent-123',
        priority: 'urgent',
        skip: 0,
        take: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should use default pagination values', async () => {
      const mockResult = { data: [], total: 0 };
      mockTaskService.findAll.mockResolvedValue(mockResult);

      const req = { agent: { agentId: 'agent-123' } };
      const query = {};

      const result = await controller.getTasks(query, req);

      expect(taskService.findAll).toHaveBeenCalledWith({
        assigneeId: 'agent-123',
        skip: 0,
        take: 10,
      });
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 0,
      });
    });

    it('should handle empty task list', async () => {
      const mockResult = { data: [], total: 0 };
      mockTaskService.findAll.mockResolvedValue(mockResult);

      const req = { agent: { agentId: 'agent-123' } };
      const query = { page: 1, pageSize: 10 };

      const result = await controller.getTasks(query, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});
