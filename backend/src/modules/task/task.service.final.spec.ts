import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { Repository, DataSource } from 'typeorm';

describe('TaskService - Final Coverage', () => {
  let service: TaskService;
  let repository: Repository<Task>;
  let dataSource: DataSource;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb({
      queryRunner: {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      },
      manager: {
        save: jest.fn(),
      },
    })),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    dataSource = mockDataSource as any;
    service = new TaskService(repository, dataSource);
  });

  describe('create with all fields', () => {
    it('should create task with all optional fields', async () => {
      const createTaskDto = {
        title: 'Full Task',
        description: 'Full Description',
        priority: TaskPriority.URGENT,
        dueDate: '2024-12-31',
        assigneeId: 'user-1',
        parentId: 'parent-1',
        metadata: { key: 'value' },
      };

      const mockTask = {
        id: 'task-1',
        ...createTaskDto,
        dueDate: new Date(createTaskDto.dueDate),
        status: TaskStatus.TODO,
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result).toBeDefined();
    });
  });

  describe('updateProgress edge cases', () => {
    it('should handle progress at exactly 100', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: 100 };

      const mockTask = {
        id: taskId,
        progress: 100,
        status: TaskStatus.DONE,
      };

      mockRepository.findOne.mockResolvedValue({ id: taskId, progress: 50 });
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.updateProgress(taskId, progressDto);

      expect(result.progress).toBe(100);
    });
  });

  describe('findAll pagination', () => {
    it('should handle large page numbers', async () => {
      const filterDto = {
        page: 100,
        pageSize: 10,
      };

      mockRepository.find.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.findAll(filterDto);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
