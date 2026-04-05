import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from './entities/task.entity';
import { mockRepository, MockDataSource } from '@common/utils/mocks';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: any;
  let statusHistoryRepository: any;
  let statusMachine: any;

  const mockTask = {
    id: 'task-001',
    title: '测试任务001',
    description: '测试任务描述',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    progress: 0,
    assigneeId: 'admin',
    creatorId: 'admin',
    dueDate: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(TaskStatusHistory),
          useValue: mockRepository(),
        },
        {
          provide: TaskStatusMachineService,
          useValue: {
            validateTransition: jest.fn(),
            canTransition: jest.fn(),
            getNextStatuses: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: MockDataSource,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<any>(getRepositoryToken(Task));
    statusMachine = module.get<TaskStatusMachineService>(TaskStatusMachineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task successfully', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.MEDIUM,
        assigneeId: 'agent-001',
      };

      const userId = 'user-001';

      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, userId);

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalled();
      expect(taskRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks with pagination', async () => {
      const queryDto = {
        status: TaskStatus.TODO,
        assigneeId: 'agent-001',
        page: 1,
        pageSize: 10,
      };

      const result = await service.findAll(queryDto);

      expect(result.tasks).toEqual([mockTask]);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-001');

      expect(result).toHaveProperty('id', 'task-001');
      expect(result).toHaveProperty('isBlockedByDependency');
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-001' },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto = {
        title: 'Updated Task',
        progress: 50,
      };

      const userId = 'admin'; // 使用创建者ID

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.update.mockResolvedValue({ affected: 1 });
      taskRepository.findOne.mockResolvedValue({ ...mockTask, ...updateDto });

      const result = await service.update('task-001', updateDto, userId);

      expect(result.title).toBe('Updated Task');
      expect(result.progress).toBe(50);
    });

    it('should throw NotFoundException if task not found', async () => {
      const updateDto = { title: 'Updated' };
      const userId = 'admin';

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.update('task-001', updateDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('task-001');

      expect(taskRepository.softDelete).toHaveBeenCalledWith('task-001');
    });

    it('should throw error if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow();
    });
  });
});
