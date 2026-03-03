import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskService } from '../src/modules/task/task.service';
import { Task, TaskStatus, TaskPriority } from '../src/modules/task/entities/task.entity';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let dataSource: DataSource;

  const mockTask = {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    progress: 0,
    dueDate: new Date(),
    assigneeId: 'test-user-id',
    parentId: null,
    metadata: {},
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.HIGH,
        dueDate: '2024-12-31',
      };

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'test-user-id');

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toEqual([mockTask]);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ status: TaskStatus.TODO, page: 1, pageSize: 10 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.TODO },
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('test-task-id');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('test-task-id', updateTaskDto);

      expect(mockTaskRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException on version conflict', async () => {
      const updateTaskDto = { title: 'Updated Title' };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.update('test-task-id', updateTaskDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
