import { Test, TestingModule } from '@nestjs/testing';
import { StartTaskController } from './start-task.controller';
import { TaskService } from '../../task/task.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('StartTaskController', () => {
  let controller: StartTaskController;
  let taskService: TaskService;

  const mockTaskService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartTaskController],
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

    controller = module.get<StartTaskController>(StartTaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startTask', () => {
    it('should start a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'todo',
      };

      const updatedTask = {
        ...mockTask,
        status: 'in_progress',
        startedAt: new Date(),
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.startTask('task-123', req);

      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(taskService.update).toHaveBeenCalledWith('task-123', expect.objectContaining({
        status: 'in_progress',
        startedAt: expect.any(Date),
        lastApiCallAt: expect.any(Date),
      }));
      expect(result.success).toBe(true);
      expect(result.message).toBe('任务已开始');
      expect(result.data.status).toBe('in_progress');
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.startTask('non-existent-task', req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when task is not assigned to agent', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'other-agent-456',
        status: 'todo',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.startTask('task-123', req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when task status is not todo', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.startTask('task-123', req)).rejects.toThrow(
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

      await expect(controller.startTask('task-123', req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when task is blocked', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'blocked',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.startTask('task-123', req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set startedAt timestamp correctly', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'todo',
      };

      const beforeTime = new Date();
      const updatedTask = {
        ...mockTask,
        status: 'in_progress',
        startedAt: new Date(),
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      await controller.startTask('task-123', req);

      const afterTime = new Date();
      expect(updatedTask.startedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedTask.startedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
