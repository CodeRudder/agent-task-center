import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { TaskService } from "./task.service";
import { Task, TaskStatus } from "../entities/task.entity";
import { TaskStatusHistory, ChangedByType } from "../entities/task-status-history.entity";
import { TaskStatusMachineService } from "./task-status-machine.service";

describe("TaskService - Status Flow", () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let statusHistoryRepository: Repository<TaskStatusHistory>;
  let statusMachine: TaskStatusMachineService;
  let dataSource: DataSource;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockStatusHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockStatusMachine = {
    canTransition: jest.fn(),
    getNextStatuses: jest.fn(),
    validateTransition: jest.fn(),
    requireReason: jest.fn(),
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
          provide: getRepositoryToken(TaskStatusHistory),
          useValue: mockStatusHistoryRepository,
        },
        {
          provide: TaskStatusMachineService,
          useValue: mockStatusMachine,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    statusHistoryRepository = module.get<Repository<TaskStatusHistory>>(
      getRepositoryToken(TaskStatusHistory),
    );
    statusMachine = module.get<TaskStatusMachineService>(TaskStatusMachineService);
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("updateStatus", () => {
    const mockTask: Partial<Task> = {
      id: "task-id",
      title: "Test Task",
      status: TaskStatus.TODO,
      priority: "medium" as any,
      progress: 0,
      creatorId: "creator-id",
      assigneeId: "assignee-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    it("should successfully update task status from TODO to IN_PROGRESS", async () => {
      mockStatusMachine.validateTransition.mockReturnValue(undefined);
      mockStatusMachine.requireReason.mockReturnValue(false);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity) => entity),
          save: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      const result = await service.updateStatus(
        "task-id",
        TaskStatus.IN_PROGRESS,
        "user-id",
        "user",
      );

      expect(result).toBeDefined();
      expect(mockStatusMachine.validateTransition).toHaveBeenCalledWith(
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
      );
    });

    it("should throw NotFoundException if task does not exist", async () => {
      mockStatusMachine.validateTransition.mockReturnValue(undefined);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(null),
        } as any);
      });

      await expect(
        service.updateStatus("invalid-id", TaskStatus.IN_PROGRESS, "user-id", "user"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for invalid transition", async () => {
      mockStatusMachine.validateTransition.mockImplementation(() => {
        throw new BadRequestException("不允许从 done 流转到 todo");
      });
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      await expect(
        service.updateStatus("task-id", TaskStatus.TODO, "user-id", "user"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should require reason for specific transitions", async () => {
      mockStatusMachine.validateTransition.mockReturnValue(undefined);
      mockStatusMachine.requireReason.mockReturnValue(true);

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity) => entity),
          save: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      await expect(
        service.updateStatus(
          "task-id",
          TaskStatus.BLOCKED,
          "user-id",
          "user",
          undefined, // no reason
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow transition when reason is provided for required transitions", async () => {
      mockStatusMachine.validateTransition.mockReturnValue(undefined);
      mockStatusMachine.requireReason.mockReturnValue(true);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity) => entity),
          save: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      const result = await service.updateStatus(
        "task-id",
        TaskStatus.BLOCKED,
        "user-id",
        "user",
        "遇到问题，需要等待资源",
      );

      expect(result).toBeDefined();
    });

    it("should handle agent type correctly", async () => {
      mockStatusMachine.validateTransition.mockReturnValue(undefined);
      mockStatusMachine.requireReason.mockReturnValue(false);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity) => entity),
          save: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      const result = await service.updateStatus(
        "task-id",
        TaskStatus.IN_PROGRESS,
        "agent-id",
        "agent",
      );

      expect(result).toBeDefined();
    });

    it("should create status history record", async () => {
      mockStatusMachine.validateTransition.mockReturnValue(undefined);
      mockStatusMachine.requireReason.mockReturnValue(false);
      
      const saveSpy = jest.fn().mockImplementation(async (entity) => {
        return entity;
      });

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity) => {
            return entity;
          }),
          save: saveSpy,
        } as any);
      });

      await service.updateStatus(
        "task-id",
        TaskStatus.IN_PROGRESS,
        "user-id",
        "user",
        "开始处理",
      );

      // Verify save was called twice (once for task, once for statusHistory)
      expect(saveSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("getStatusHistories", () => {
    const mockHistories: TaskStatusHistory[] = [
      {
        id: "history-1",
        taskId: "task-id",
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        changedBy: "user-1",
        changedByType: ChangedByType.USER,
        reason: "开始处理",
        changedAt: new Date(),
        changer: { id: "user-1", name: "User 1" } as any,
        task: {} as any,
      },
      {
        id: "history-2",
        taskId: "task-id",
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.DONE,
        changedBy: "user-2",
        changedByType: ChangedByType.AGENT,
        reason: "任务完成",
        changedAt: new Date(),
        changer: { id: "user-2", name: "Agent 2" } as any,
        task: {} as any,
      },
    ];

    it("should return status histories with pagination", async () => {
      mockStatusHistoryRepository.findAndCount.mockResolvedValue([mockHistories, 2]);

      const result = await service.getStatusHistories("task-id", 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockStatusHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { taskId: "task-id" },
        order: { changedAt: "DESC" },
        skip: 0,
        take: 20,
        relations: ["changer"],
      });
    });

    it("should map history items correctly", async () => {
      mockStatusHistoryRepository.findAndCount.mockResolvedValue([mockHistories, 2]);

      const result = await service.getStatusHistories("task-id");

      expect(result.items[0].id).toBe("history-1");
      expect(result.items[0].oldStatus).toBe(TaskStatus.TODO);
      expect(result.items[0].newStatus).toBe(TaskStatus.IN_PROGRESS);
      expect(result.items[0].changedBy).toBe("user-1");
      expect(result.items[0].changedByType).toBe(ChangedByType.USER);
      expect(result.items[0].reason).toBe("开始处理");
      expect(result.items[0].changerName).toBe("User 1");
    });

    it("should handle empty histories", async () => {
      mockStatusHistoryRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getStatusHistories("task-id");

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should handle pagination correctly", async () => {
      mockStatusHistoryRepository.findAndCount.mockResolvedValue([mockHistories, 10]);

      const result = await service.getStatusHistories("task-id", 2, 5);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockStatusHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { taskId: "task-id" },
        order: { changedAt: "DESC" },
        skip: 5,
        take: 5,
        relations: ["changer"],
      });
    });

    it("should handle missing changer", async () => {
      const mockHistoryWithoutChanger: TaskStatusHistory = {
        id: "history-1",
        taskId: "task-id",
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        changedBy: "user-1",
        changedByType: ChangedByType.USER,
        reason: "开始处理",
        changedAt: new Date(),
        changer: null,
        task: {} as any,
      };

      mockStatusHistoryRepository.findAndCount.mockResolvedValue([[mockHistoryWithoutChanger], 1]);

      const result = await service.getStatusHistories("task-id");

      expect(result.items[0].changerName).toBeUndefined();
    });
  });
});
