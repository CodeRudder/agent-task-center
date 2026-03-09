import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskStatus, TaskPriority } from './entities/task.entity';

describe('TaskController - Additional Coverage', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateProgress: jest.fn(),
  };

  beforeEach(() => {
    service = mockTaskService as any;
    controller = new TaskController(service);
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        priority: TaskPriority.HIGH,
      };

      const mockRequest = {
        user: { id: 'user-1' },
      };

      const expectedResult = {
        id: 'task-1',
        ...createTaskDto,
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
      };

      mockTaskService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTaskDto, mockRequest);

      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProgress', () => {
    it('should update task progress', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: 50 };

      const expectedResult = {
        id: taskId,
        progress: 50,
      };

      mockTaskService.updateProgress.mockResolvedValue(expectedResult);

      const result = await controller.updateProgress(taskId, progressDto);

      expect(mockTaskService.updateProgress).toHaveBeenCalledWith(taskId, progressDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const taskId = 'task-1';

      mockTaskService.remove.mockResolvedValue(undefined);

      await controller.remove(taskId);

      expect(mockTaskService.remove).toHaveBeenCalledWith(taskId);
    });
  });
});
