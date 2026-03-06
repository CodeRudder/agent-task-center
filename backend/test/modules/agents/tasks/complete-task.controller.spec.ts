import { Test, TestingModule } from '@nestjs/testing';
import { CompleteTaskController } from '../../../../src/modules/agents/tasks/complete-task.controller';
import { TaskService } from '../../../../src/modules/task/task.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CompleteTaskController', () => {
  let controller: CompleteTaskController;
  let taskService: TaskService;

  const mockTaskService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompleteTaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        {
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('completeTask', () => {
    it('should complete a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
        progress: 50,
      };

      const updatedTask = {
        ...mockTask,
        status: 'done',
        progress: 100,
        completedAt: new Date(),
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.completeTask('task-123', req);

      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(taskService.update).toHaveBeenCalledWith('task-123', expect.objectContaining({
        status: 'done',
        progress: 100,
        completedAt: expect.any(Date),
        lastApiCallAt: expect.any(Date),
      }));
      expect(result.success).toBe(true);
      expect(result.message).toBe('任务已完成');
      expect(result.data.status).toBe('done');
      expect(result.data.progress).toBe(100);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.completeTask('non-existent-task', req)).rejects.toThrow(
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

      await expect(controller.completeTask('task-123', req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when task status is not in_progress', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'todo',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.completeTask('task-123', req)).rejects.toThrow(
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

      await expect(controller.completeTask('task-123', req)).rejects.toThrow(
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

      await expect(controller.completeTask('task-123', req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set completedAt timestamp correctly', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
      };

      const beforeTime = new Date();
      const updatedTask = {
        ...mockTask,
        status: 'done',
        progress: 100,
        completedAt: new Date(),
        lastApiCallAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      await controller.completeTask('task-123', req);

      const afterTime = new Date();
      expect(updatedTask.completedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedTask.completedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should update progress to 100 even if it was not 100 before', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        status: 'in_progress',
        progress: 75,
      };

      const updatedTask = {
        ...mockTask,
        status: 'done',
        progress: 100,
        completedAt: new Date(),
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.update.mockResolvedValue(updatedTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.completeTask('task-123', req);

      expect(result.data.progress).toBe(100);
    });
  });
});
