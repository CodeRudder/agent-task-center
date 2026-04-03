import { TaskService } from './services/task.service';
import { Task } from './entities/task.entity';
import { Repository, DataSource } from 'typeorm';
import { TaskStatusMachineService } from './services/task-status-machine.service';

describe('TaskService - Additional Coverage', () => {
  let service: TaskService;
  let repository: Repository<Task>;
  let statusHistoryRepository: Repository<any>;
  let statusMachine: TaskStatusMachineService;
  let dataSource: DataSource;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockStatusHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockStatusMachine = {
    validateTransition: jest.fn(),
    requireReason: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
    createQueryRunner: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    statusHistoryRepository = mockStatusHistoryRepository as any;
    statusMachine = mockStatusMachine as any;
    dataSource = mockDataSource as any;
    service = new TaskService(repository, statusHistoryRepository, statusMachine, dataSource);
  });

  describe('findAll', () => {
    it('should return all tasks with pagination', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: TaskStatus.TODO },
        { id: '2', title: 'Task 2', status: TaskStatus.DONE },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTasks, 2]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.tasks).toEqual(mockTasks);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = { id: '1', title: 'Task 1', status: TaskStatus.TODO };

      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('1');

      expect(result).toEqual(mockTask);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should return null if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto = { title: 'Updated Task' };
      const mockTask = { id: '1', ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.update('1', updateDto, 'user-1');

      expect(result.title).toBe('Updated Task');
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      const mockTask = { id: '1', title: 'Task 1' };
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
