import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { Repository, DataSource } from 'typeorm';
import { mockRepository, MockDataSource } from '@common/utils/mocks';

describe('TaskService - Final Coverage', () => {
  let service: TaskService;
  let repository: any;
  let statusHistoryRepository: any;
  let statusMachine: any;
  let dataSource: any;

  beforeEach(() => {
    repository = mockRepository();
    statusHistoryRepository = mockRepository();
    statusMachine = {
      canTransition: jest.fn(),
      validateTransition: jest.fn(),
    };
    dataSource = MockDataSource;
    service = new TaskService(repository, statusHistoryRepository, statusMachine, dataSource);
  });

  describe('create with all fields', () => {
    it('should create task with all optional fields', async () => {
      const createTaskDto = {
        title: 'Full Task',
        description: 'Full Description',
        priority: TaskPriority.URGENT,
        dueDate: '2024-12-31',
        assigneeId: 'user-1',
      };

      const mockTask = {
        id: 'task-1',
        ...createTaskDto,
      };

      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(result).toEqual(mockTask);
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('update with partial data', () => {
    it('should update only provided fields', async () => {
      const updateDto = { title: 'Updated Title' };
      const mockTask = { id: 'task-1', title: 'Updated Title', creatorId: 'user-1', assigneeId: 'user-1' };

      repository.findOne.mockResolvedValue(mockTask);
      repository.update.mockResolvedValue({ affected: 1 });
      repository.findOne.mockResolvedValue(mockTask);

      const result = await service.update('task-1', updateDto, 'user-1');

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete with soft delete', () => {
    it('should soft delete task', async () => {
      const mockTask = { id: 'task-1' };

      repository.findOne.mockResolvedValue(mockTask);
      repository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('task-1');

      expect(repository.softDelete).toHaveBeenCalledWith('task-1');
    });
  });

  describe('findOne with not found', () => {
    it('should throw NotFoundException', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow();
    });
  });
});
