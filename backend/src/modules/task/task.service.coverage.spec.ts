import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { Repository, DataSource } from 'typeorm';
import { mockRepository, MockDataSource } from '@common/utils/mocks';

describe('TaskService - Additional Coverage', () => {
  let service: TaskService;
  let repository: any;
  let statusHistoryRepository: any;
  let statusMachine: any;
  let dataSource: any;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  beforeEach(() => {
    repository = {
      ...mockRepository(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    statusHistoryRepository = mockRepository();
    statusMachine = {
      validateTransition: jest.fn(),
      requireReason: jest.fn(),
      canTransition: jest.fn(),
    };
    dataSource = MockDataSource;
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

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.tasks).toEqual(mockTasks);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = { id: '1', title: 'Task 1', status: TaskStatus.TODO };

      repository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('1');

      expect(result).toHaveProperty('id', '1');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if task not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto = { title: 'Updated Task' };
      const mockTask = { id: '1', title: 'Updated Task', creatorId: 'user-1', assigneeId: 'user-1' };

      repository.findOne.mockResolvedValue(mockTask);
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(mockTask);

      const result = await service.update('1', updateDto, 'user-1');

      expect(result.title).toBe('Updated Task');
    });
  });

  describe('remove', () => {
    it('should soft delete a task', async () => {
      const mockTask = { id: '1', title: 'Task 1' };
      repository.findOne.mockResolvedValue(mockTask);
      repository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1');

      expect(repository.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
