import { TaskService } from './task.service';
import { TaskStatusMachineService } from './task-status-machine.service';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { TaskStatusHistory, ChangedByType } from '../entities/task-status-history.entity';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mockRepository, MockDataSource } from '@common/utils/mocks';

describe('TaskService - Status Flow', () => {
  let service: TaskService;
  let taskRepository: any;
  let statusHistoryRepository: any;
  let statusMachine: any;
  let dataSource: any;

  const mockTask: Task = {
    id: 'task-id',
    title: 'Test Task',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    progress: 0,
    assigneeId: 'user-1',
    creatorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(() => {
    taskRepository = mockRepository();
    statusHistoryRepository = mockRepository();
    statusMachine = {
      validateTransition: jest.fn(),
      canTransition: jest.fn(),
      getNextStatuses: jest.fn(),
      requireReason: jest.fn(),
      transitionRules: {} as any,
      requireReasonForStatus: jest.fn(),
    } as any;
    dataSource = MockDataSource;
    service = new TaskService(taskRepository, statusHistoryRepository, statusMachine, dataSource);
  });

  describe('updateStatus', () => {
    it('should successfully update task status', async () => {
      (statusMachine.validateTransition as jest.Mock).mockReturnValue(undefined);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity: any) => entity),
          save: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      const result = await service.updateStatus(
        'task-id',
        { status: TaskStatus.IN_PROGRESS },
        'user-id',
        'user',
      );

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if task does not exist', async () => {
      (statusMachine.validateTransition as jest.Mock).mockReturnValue(undefined);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(null),
        } as any);
      });

      await expect(
        service.updateStatus('invalid-id', { status: TaskStatus.IN_PROGRESS }, 'user-id', 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      (statusMachine.validateTransition as jest.Mock).mockImplementation(() => {
        throw new BadRequestException('不允许从 done 流转到 todo');
      });
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      await expect(
        service.updateStatus('task-id', { status: TaskStatus.TODO }, 'user-id', 'user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require reason for specific transitions', async () => {
      (statusMachine.validateTransition as jest.Mock).mockReturnValue(undefined);
      (statusMachine.requireReason as jest.Mock).mockReturnValue(true);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      await expect(
        service.updateStatus(
          'task-id',
          { status: TaskStatus.BLOCKED },
          'user-id',
          'user',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow transition when reason is provided for required transitions', async () => {
      (statusMachine.validateTransition as jest.Mock).mockReturnValue(undefined);
      (statusMachine.requireReason as jest.Mock).mockReturnValue(true);
      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          create: jest.fn().mockImplementation((entity: any) => entity),
          save: jest.fn().mockResolvedValue(mockTask),
        } as any);
      });

      const result = await service.updateStatus(
        'task-id',
        { status: TaskStatus.BLOCKED, reason: '遇到问题，需要等待资源' },
        'user-id',
        'user',
      );

      expect(result).toBeDefined();
    });
  });

  describe('getStatusHistories', () => {
    const mockHistories: TaskStatusHistory[] = [
      {
        id: 'history-1',
        taskId: 'task-id',
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        changedBy: 'user-1',
        changedByType: ChangedByType.USER,
        reason: '开始处理',
        changedAt: new Date(),
        changerId: { id: 'user-1', name: 'User 1' } as any,
        changerName: 'User 1',
        createdAt: new Date(),
        task: {} as any,
      },
      {
        id: 'history-2',
        taskId: 'task-id',
        oldStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.DONE,
        changedBy: 'user-2',
        changedByType: ChangedByType.AGENT,
        reason: '任务完成',
        changedAt: new Date(),
        changerId: { id: 'user-2', name: 'Agent 2' } as any,
        changerName: 'Agent 2',
        createdAt: new Date(),
        task: {} as any,
      },
    ];

    it('should return status histories with pagination', async () => {
      statusHistoryRepository.findAndCount.mockResolvedValue([mockHistories, 2]);

      const result = await service.getStatusHistories('task-id', 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter histories by task ID', async () => {
      statusHistoryRepository.findAndCount.mockResolvedValue([mockHistories, 2]);

      await service.getStatusHistories('task-id', 1, 20);

      expect(statusHistoryRepository.findAndCount).toHaveBeenCalledWith({
        where: { taskId: 'task-id' },
        order: { changedAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle empty history', async () => {
      statusHistoryRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getStatusHistories('task-id', 1, 20);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
