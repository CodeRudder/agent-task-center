import { Test, TestingModule } from '@nestjs/testing';
import { GetTaskDetailsController } from '../../../../src/modules/agents/tasks/get-task-details.controller';
import { TaskService } from '../../../../src/modules/task/task.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AgentAuthGuard } from '../../../../src/modules/agents/guards/agent-auth.guard';

describe('GetTaskDetailsController', () => {
  let controller: GetTaskDetailsController;
  let taskService: TaskService;

  const mockTaskService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetTaskDetailsController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    })
    .overrideGuard(AgentAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<GetTaskDetailsController>(GetTaskDetailsController);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTask', () => {
    it('should return task details successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        progress: 0,
        assigneeId: 'agent-123',
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.getTask('task-123', req);

      expect(taskService.findOne).toHaveBeenCalledWith('task-123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const req = { agent: { agentId: 'agent-123' } };

      await expect(controller.getTask('non-existent-task', req)).rejects.toThrow(
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

      await expect(controller.getTask('task-123', req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return task with all fields', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        status: 'in_progress',
        priority: 'high',
        progress: 50,
        assigneeId: 'agent-123',
        metadata: { key: 'value' },
        startedAt: new Date(),
        completedAt: null,
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.getTask('task-123', req);

      expect(result.data).toEqual(mockTask);
      expect(result.data.progress).toBe(50);
    });

    it('should handle task with metadata', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assigneeId: 'agent-123',
        metadata: {
          key1: 'value1',
          key2: 123,
          nested: { subKey: 'subValue' },
        },
      };

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const req = { agent: { agentId: 'agent-123' } };

      const result = await controller.getTask('task-123', req);

      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.key1).toBe('value1');
    });
  });
});
