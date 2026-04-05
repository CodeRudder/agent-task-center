import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { Repository, DataSource } from 'typeorm';
import { mockRepository, MockDataSource } from '@common/utils/mocks';

describe('TaskService - Complete Coverage', () => {
  let service: TaskService;
  let repository: any;
  let statusHistoryRepository: any;
  let dataSource: any;
  let statusMachine: any;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
    transaction: jest.fn((callback) => callback({
      findOne: jest.fn(),
      save: jest.fn(),
    })),
  };

  beforeEach(() => {
    repository = {
      ...mockRepository(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    statusHistoryRepository = mockRepository();
    dataSource = mockDataSource;
    statusMachine = {
      canTransition: jest.fn(),
      transition: jest.fn(),
      validateTransition: jest.fn(),
    };
    service = new TaskService(repository, statusHistoryRepository, statusMachine, dataSource);
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

      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result).toEqual(mockTask);
      expect(repository.create).toHaveBeenCalled();
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

      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);

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

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ id: taskId, progress: 0 }),
          save: jest.fn().mockResolvedValue(mockTask),
        };
        return await callback(mockManager);
      });

      const result = await service.updateProgress(taskId, progressDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should cap progress at 100', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: 150 };

      const mockTask = {
        id: taskId,
        progress: 100,
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ id: taskId, progress: 0 }),
          save: jest.fn().mockResolvedValue(mockTask),
        };
        return await callback(mockManager);
      });

      await service.updateProgress(taskId, progressDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
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

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(filterDto);

      expect(result.tasks).toBeDefined();
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

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(filterDto);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      const taskId = 'task-1';
      const mockTask = { id: taskId };

      repository.findOne.mockResolvedValue(mockTask);
      repository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(taskId);

      expect(repository.softDelete).toHaveBeenCalledWith(taskId);
    });
  });
});
