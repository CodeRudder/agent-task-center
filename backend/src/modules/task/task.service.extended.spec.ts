import { TaskService } from './services/task.service';
import { Task } from './entities/task.entity';

describe('TaskService - Extended Tests', () => {
  let service: TaskService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
      })),
    };

    service = new TaskService(mockRepository);
  });

  describe('create', () => {
    it('should create a task with all fields', async () => {
      const createDto = {
        title: 'New Task',
        description: 'Task description',
        status: 'pending',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        assignedTo: 'user-001',
      };

      const mockTask = {
        id: 'task-001',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createDto, 'user-001');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });
  });

  describe('findByStatus', () => {
    it('should return tasks filtered by status', async () => {
      const mockTasks = [
        { id: 'task-001', status: 'pending' },
        { id: 'task-002', status: 'pending' },
      ];

      mockRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findByStatus('pending');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('countByStatus', () => {
    it('should return count of tasks by status', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.countByStatus('completed');

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { status: 'completed' },
      });
      expect(result).toBe(5);
    });
  });

  describe('updateProgress', () => {
    it('should update task progress', async () => {
      const taskId = 'task-001';
      const progress = 75;

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateProgress(taskId, progress);

      expect(mockRepository.update).toHaveBeenCalledWith(taskId, {
        progress,
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });

  describe('findByAssignee', () => {
    it('should return tasks assigned to a user', async () => {
      const mockTasks = [
        { id: 'task-001', assignedTo: 'user-001' },
        { id: 'task-002', assignedTo: 'user-001' },
      ];

      mockRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findByAssignee('user-001');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { assignedTo: 'user-001' },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('markAsComplete', () => {
    it('should mark a task as complete', async () => {
      const taskId = 'task-001';

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.markAsComplete(taskId);

      expect(mockRepository.update).toHaveBeenCalledWith(taskId, {
        status: 'completed',
        completedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should search tasks by keyword', async () => {
      const keyword = 'important';
      const mockTasks = [{ id: 'task-001', title: 'Important Task' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(keyword);

      expect(result).toEqual(mockTasks);
    });
  });
});
