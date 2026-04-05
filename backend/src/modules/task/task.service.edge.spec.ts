import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { mockRepository } from '@common/utils/mocks';

describe('TaskService - Edge Cases', () => {
  let service: TaskService;
  let repository: any;
  let statusHistoryRepository: any;
  let statusMachine: any;
  let dataSource: any;

  const mockDataSource = {
    createQueryRunner: jest.fn(),
    transaction: jest.fn((cb) => cb({
      findOne: jest.fn().mockResolvedValue({ id: 'task-1', progress: 50 }),
      save: jest.fn().mockResolvedValue({ id: 'task-1', progress: 0 }),
    })),
  };

  beforeEach(() => {
    repository = mockRepository();
    statusHistoryRepository = mockRepository();
    statusMachine = {
      canTransition: jest.fn(),
      validateTransition: jest.fn(),
    };
    dataSource = mockDataSource;
    service = new TaskService(repository, statusHistoryRepository, statusMachine, dataSource);
  });

  describe('findOne - NotFoundException', () => {
    it('should throw NotFoundException if task not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create with dueDate', () => {
    it('should parse dueDate string to Date', async () => {
      const createTaskDto = {
        title: 'Task with due date',
        dueDate: '2024-12-31',
      };

      const mockTask = {
        id: 'task-1',
        ...createTaskDto,
        dueDate: new Date('2024-12-31'),
      };

      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('updateProgress - negative values', () => {
    it('should handle negative progress', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: -10 };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ id: taskId, progress: 0 }),
          save: jest.fn().mockResolvedValue({ id: taskId, progress: 0 }),
        };
        return await callback(mockManager);
      });

      await service.updateProgress(taskId, progressDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('findAll - pagination', () => {
    it('should handle page and pageSize correctly', async () => {
      const filterDto = {
        page: 2,
        pageSize: 5,
      };

      const mockQueryBuilder = {
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
      expect(result.tasks).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });
});
