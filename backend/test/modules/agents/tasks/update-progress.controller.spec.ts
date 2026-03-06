import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProgressController } from './update-progress.controller';
import { TaskService } from '../../task/task.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UpdateProgressController', () => {
  let controller: UpdateProgressController;
  let taskService: TaskService;

  const mockTaskService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateProgressController],
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

    controller = module.get<UpdateProgressController>(UpdateProgressController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateProgress', () => {
    it('should update task progress successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        progress: 50,
      };

      const updatedTask = {
        ...mockTask,
        progress: 75,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: 75 };

      const result = await controller.updateProgress('task-123', body, req);

      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(taskService.update).toHaveBeenCalledWith('task-123', expect.objectContaining({
        progress: 75,
        lastApiCallAt: expect.any(Date),
      }));
      expect(result.success).toBe(true);
      expect(result.message).toBe('进度更新成功');
    });

    it('should throw BadRequestException for invalid progress (negative)', async () => {
      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: -10 };

      await expect(controller.updateProgress('task-123', body, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid progress (> 100)', async () => {
      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: 150 };

      await expect(controller.updateProgress('task-123', body, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: 50 };

      await expect(controller.updateProgress('non-existent-task', body, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when task is not assigned to agent', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'other-agent-456',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: 50 };

      await expect(controller.updateProgress('task-123', body, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should accept progress value of 100', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        progress: 50,
      };

      const updatedTask = {
        ...mockTask,
        progress: 100,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: 100 };

      const result = await controller.updateProgress('task-123', body, req);

      expect(result.success).toBe(true);
      expect(result.data.progress).toBe(100);
    });

    it('should accept progress value of 0', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        progress: 50,
      };

      const updatedTask = {
        ...mockTask,
        progress: 0,
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };
      const body = { progress: 0 };

      const result = await controller.updateProgress('task-123', body, req);

      expect(result.success).toBe(true);
      expect(result.data.progress).toBe(0);
    });
  });
});
