import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskPriority, TaskStatus } from './entities/task.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.MEDIUM,
        assignedAgentId: 'agent-001',
        dueDate: new Date(),
      };

      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      const expectedResult = {
        id: 'task-001',
        ...createTaskDto,
        status: TaskStatus.TODO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTaskDto, mockRequest);

      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto, 'user-001');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const expectedResult = {
        items: [
          {
            id: 'task-001',
            title: 'Task 1',
            description: 'Description 1',
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
          },
        ],
        total: 1,
      };

      mockTaskService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(undefined, undefined, 1, 10);

      expect(mockTaskService.findAll).toHaveBeenCalledWith({
        status: undefined,
        assigneeId: undefined,
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const expectedResult = {
        id: 'task-001',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      };

      mockTaskService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('task-001');

      expect(mockTaskService.findOne).toHaveBeenCalledWith('task-001');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
      };

      const expectedResult = {
        id: 'task-001',
        title: 'Updated Task',
        description: 'Test Description',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      };

      mockTaskService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('task-001', updateTaskDto);

      expect(mockTaskService.update).toHaveBeenCalledWith('task-001', updateTaskDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      mockTaskService.remove.mockResolvedValue(undefined);

      await controller.remove('task-001');

      expect(mockTaskService.remove).toHaveBeenCalledWith('task-001');
    });
  });
});
