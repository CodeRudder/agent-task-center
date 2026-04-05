import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { Task } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { TaskStatus, TaskPriority } from './entities/task.entity';
import { mockRepository, MockDataSource } from '@common/utils/mocks';

describe('TaskService - Extended Tests', () => {
  let service: TaskService;
  let repository: any;
  let statusHistoryRepository: any;
  let statusMachine: any;
  let dataSource: any;

  beforeEach(() => {
    repository = {
      ...mockRepository(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
      })),
    };
    statusHistoryRepository = mockRepository();
    statusMachine = {
      canTransition: jest.fn(),
      validateTransition: jest.fn(),
    };
    dataSource = MockDataSource;
    service = new TaskService(repository, statusHistoryRepository, statusMachine, dataSource);
  });

  describe('create', () => {
    it('should create a task with all fields', async () => {
      const createDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
        assigneeId: 'user-001',
      };

      const mockTask = {
        id: 'task-001',
        ...createDto,
      };

      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);

      const result = await service.create(createDto, 'user-001');

      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks with filters', async () => {
      const mockTasks = [
        { id: 'task-001', title: 'Task 1' },
        { id: 'task-002', title: 'Task 2' },
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
      const mockTask = { id: 'task-001', title: 'Task 1' };

      repository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-001');

      expect(result).toHaveProperty('id', 'task-001');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const mockTask = { id: 'task-001' };

      repository.findOne.mockResolvedValue(mockTask);
      repository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('task-001');

      expect(repository.softDelete).toHaveBeenCalledWith('task-001');
    });
  });
});
