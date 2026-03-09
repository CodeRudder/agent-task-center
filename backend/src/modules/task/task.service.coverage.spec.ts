import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { Repository, DataSource } from 'typeorm';

describe('TaskService - Additional Coverage', () => {
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
  };

  beforeEach(() => {
    repository = mockRepository as any;
    dataSource = mockDataSource as any;
    service = new TaskService(repository, dataSource);
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'completed' },
      ];

      mockRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAll();

      expect(result).toEqual(mockTasks);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = { id: '1', title: 'Task 1' };

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

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('1', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return total task count', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count();

      expect(result).toBe(10);
    });
  });

  describe('findByAssignee', () => {
    it('should return tasks for specific assignee', async () => {
      const mockTasks = [
        { id: '1', assignedTo: 'user-1' },
        { id: '2', assignedTo: 'user-1' },
      ];

      mockRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findByAssignee('user-1');

      expect(result).toEqual(mockTasks);
    });
  });
});
