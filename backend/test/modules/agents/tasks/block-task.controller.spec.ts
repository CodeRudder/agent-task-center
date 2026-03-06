import { Test, TestingModule } from '@nestjs/testing';
import { BlockTaskController } from './block-task.controller';
import { TaskService } from '../../task/task.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('BlockTaskController', () => {
  let controller: BlockTaskController;
  let taskService: TaskService;

  const mockTaskService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockTaskController],
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

    controller = module.get<BlockTaskController>(BlockTaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('blockTask', () => {
    it('should block a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
      };

      const updatedTask = {
        ...mockTask,
        status: 'blocked',
        blockedAt: new Date(),
        blockReason: 'Waiting for dependencies',
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: 'Waiting for dependencies' };

      const result = await controller.blockTask('task-123', body, req);

      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(taskService.update).toHaveBeenCalledWith('task-123', expect.objectContaining({
        status: 'blocked',
        blockedAt: expect.any(Date),
        blockReason: 'Waiting for dependencies',
        lastApiCallAt: expect.any(Date),
      }));
      expect(result.success).toBe(true);
      expect(result.message).toBe('任务已标记为阻塞');
      expect(result.data.status).toBe('blocked');
      expect(result.data.blockReason).toBe('Waiting for dependencies');
    });

    it('should throw BadRequestException when reason is empty', async () => {
      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: '' };

      await expect(controller.blockTask('task-123', body, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when reason is missing', async () => {
      const req = { agent: { agentId: 'agent-123' } };
      const body = {};

      await expect(controller.blockTask('task-123', body, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when reason is only whitespace', async () => {
      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: '   ' };

      await expect(controller.blockTask('task-123', body, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: 'Test reason' };

      await expect(controller.blockTask('non-existent-task', body, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when task is not assigned to agent', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'other-agent-456',
        status: 'in_progress',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: 'Test reason' };

      await expect(controller.blockTask('task-123', body, req)).rejects.toThrow(
        ForbiddenException,
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
      const body = { reason: 'Test reason' };

      await expect(controller.blockTask('task-123', body, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow blocking a todo task', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'todo',
      };

      const updatedTask = {
        ...mockTask,
        status: 'blocked',
        blockedAt: new Date(),
        blockReason: 'Test reason',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: 'Test reason' };

      const result = await controller.blockTask('task-123', body, req);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('blocked');
    });

    it('should set blockedAt timestamp correctly', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
      };

      const beforeTime = new Date();
      const updatedTask = {
        ...mockTask,
        status: 'blocked',
        blockedAt: new Date(),
        blockReason: 'Test reason',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { reason: 'Test reason' };

      await controller.blockTask('task-123', body, req);

      const afterTime = new Date();
      expect(updatedTask.blockedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedTask.blockedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
