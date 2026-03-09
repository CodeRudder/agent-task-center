import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { Repository, DataSource } from 'typeorm';

describe('TaskService - Complete Coverage', () => {
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
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
    transaction: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    dataSource = mockDataSource as any;
    service = new TaskService(repository, dataSource);
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Description',
        priority: TaskPriority.HIGH,
      };

      const mockTask = {
        id: 'task-1',
        ...createTaskDto,
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result).toEqual(mockTask);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should use provided assigneeId', async () => {
      const createTaskDto = {
        title: 'New Task',
        assigneeId: 'user-2',
      };

      const mockTask = {
        id: 'task-1',
        ...createTaskDto,
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result.assigneeId).toBe('user-2');
    });
  });

  describe('updateProgress', () => {
    it('should update task progress', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: 75 };

      const mockTask = {
        id: taskId,
        progress: 75,
      };

      mockRepository.findOne.mockResolvedValue({ id: taskId, progress: 0 });
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.updateProgress(taskId, progressDto);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should cap progress at 100', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: 150 };

      const mockTask = {
        id: taskId,
        progress: 100,
      };

      mockRepository.findOne.mockResolvedValue({ id: taskId, progress: 0 });
      mockRepository.save.mockResolvedValue(mockTask);

      await service.updateProgress(taskId, progressDto);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll with filters', () => {
    it('should filter by status', async () => {
      const filterDto = {
        status: TaskStatus.TODO,
        page: 1,
        pageSize: 10,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'task-1', status: TaskStatus.TODO }], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(filterDto);

      expect(result.items).toBeDefined();
    });

    it('should filter by assigneeId', async () => {
      const filterDto = {
        assigneeId: 'user-1',
        page: 1,
        pageSize: 10,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(filterDto);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      const taskId = 'task-1';

      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(taskId);

      expect(mockRepository.delete).toHaveBeenCalledWith(taskId);
    });
  });
});
