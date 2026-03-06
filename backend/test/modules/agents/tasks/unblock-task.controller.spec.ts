import { Test, TestingModule } from '@nestjs/testing';
import { UnblockTaskController } from './unblock-task.controller';
import { TaskService } from '../../task/task.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UnblockTaskController', () => {
  let controller: UnblockTaskController;
  let taskService: TaskService;

  const mockTaskService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnblockTaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        {
          provide: AgentAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get<UnblockTaskController>(UnblockTaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('unblockTask', () => {
    it('should unblock a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'blocked',
        blockedAt: new Date(),
        blockReason: 'Previous reason',
      };

      const updatedTask = {
        ...mockTask,
        status: 'todo',
        blockedAt: null,
        blockReason: null,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.unblockTask('task-123', req);

      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(taskService.update).toHaveBeenCalledWith('task-123', expect.objectContaining({
        status: 'todo',
        blockedAt: null,
        blockReason: null,
        lastApiCallAt: expect.any(Date),
      }));
      expect(result.success).toBe(true);
      expect(result.message).toBe('任务阻塞已解除');
      expect(result.data.status).toBe('todo');
      expect(result.data.blockedAt).toBeNull();
      expect(result.data.blockReason).toBeNull();
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.unblockTask('non-existent-task', req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when task is not assigned to agent', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'other-agent-456',
        status: 'blocked',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.unblockTask('task-123', req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when task status is not blocked', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'todo',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.unblockTask('task-123', req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when task is in_progress', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.unblockTask('task-123', req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when task is already done', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'done',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.unblockTask('task-123', req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should clear blockedAt field', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'blocked',
        blockedAt: new Date('2024-01-01'),
        blockReason: 'Test reason',
      };

      const updatedTask = {
        ...mockTask,
        status: 'todo',
        blockedAt: null,
        blockReason: null,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.unblockTask('task-123', req);

      expect(result.data.blockedAt).toBeNull();
    });

    it('should clear blockReason field', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'blocked',
        blockedAt: new Date(),
        blockReason: 'This is a detailed blocking reason',
      };

      const updatedTask = {
        ...mockTask,
        status: 'todo',
        blockedAt: null,
        blockReason: null,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.unblockTask('task-123', req);

      expect(result.data.blockReason).toBeNull();
    });

    it('should update lastApiCallAt timestamp', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'blocked',
      };

      const beforeTime = new Date();
      const updatedTask = {
        ...mockTask,
        status: 'todo',
        blockedAt: null,
        blockReason: null,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      await controller.unblockTask('task-123', req);

      const afterTime = new Date();
      expect(updatedTask.lastApiCallAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedTask.lastApiCallAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
