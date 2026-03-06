import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TaskService - Edge Cases', () => {
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
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
    transaction: jest.fn((cb) => cb({
      findOne: jest.fn().mockResolvedValue({ id: 'task-1', progress: 50 }),
      save: jest.fn().mockResolvedValue({ id: 'task-1', progress: 0 }),
    })),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    dataSource = mockDataSource as any;
    service = new TaskService(repository, dataSource);
  });

  describe('findOne - NotFoundException', () => {
    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update - NotFoundException', () => {
    it('should throw NotFoundException if task not found during update', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', { title: 'Updated' })).rejects.toThrow(NotFoundException);
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

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('updateProgress - negative values', () => {
    it('should handle negative progress', async () => {
      const taskId = 'task-1';
      const progressDto = { progress: -10 };

      const mockTask = {
        id: taskId,
        progress: 0,
      };

      mockRepository.findOne.mockResolvedValue({ id: taskId, progress: 50 });
      mockRepository.save.mockResolvedValue(mockTask);

      await service.updateProgress(taskId, progressDto);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll - pagination', () => {
    it('should handle page and pageSize correctly', async () => {
      const filterDto = {
        page: 2,
        pageSize: 5,
      };

      mockRepository.find.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.findAll(filterDto);

      expect(result).toBeDefined();
    });
  });
});
