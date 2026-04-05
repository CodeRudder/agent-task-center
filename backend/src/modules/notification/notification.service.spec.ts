import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationDto, PushNotificationDto, NotificationType } from './dto/notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: Repository<Notification>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      const createNotificationDto: CreateNotificationDto = {
        recipientId: 'uuid-1',
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        content: 'You have been assigned a new task',
      };

      const mockNotification = {
        id: 'uuid-notification',
        ...createNotificationDto,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createNotificationDto);

      expect(result).toEqual(mockNotification);
      expect(mockRepository.create).toHaveBeenCalledWith(createNotificationDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        {
          id: 'uuid-1',
          recipientId: 'agent-uuid',
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task assigned',
          isRead: false,
          createdAt: new Date(),
        } as Notification,
      ];

      const queryDto: QueryNotificationDto = {
        page: 1,
        pageSize: 10,
      };

      mockQueryBuilder.getMany.mockResolvedValue(mockNotifications);
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await service.findAll('agent-uuid', queryDto);

      expect(result).toEqual({
        items: mockNotifications,
        total: 5,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'notification.recipientId = :agentId',
        { agentId: 'agent-uuid' },
      );
    });

    it('should filter by unread status', async () => {
      const queryDto: QueryNotificationDto = {
        status: 'unread' as any,
        page: 1,
        pageSize: 10,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll('agent-uuid', queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.isRead = :isRead',
        { isRead: false },
      );
    });

    it('should filter by type', async () => {
      const queryDto: QueryNotificationDto = {
        type: NotificationType.TASK_ASSIGNED,
        page: 1,
        pageSize: 10,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll('agent-uuid', queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.type = :type',
        { type: NotificationType.TASK_ASSIGNED },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('agent-uuid');

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { recipientId: 'agent-uuid', isRead: false },
      });
    });
  });

  describe('push', () => {
    it('should push a notification as sender', async () => {
      const pushDto: PushNotificationDto = {
        recipientId: 'agent-uuid-2',
        type: NotificationType.AGENT_MESSAGE,
        title: 'Message from agent',
        content: 'Hello from another agent',
      };

      const senderId = 'agent-uuid-1';

      const mockNotification = {
        id: 'uuid-notification',
        ...pushDto,
        senderId,
        isRead: false,
        createdAt: new Date(),
      } as Notification;

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.push(pushDto, senderId);

      expect(result.senderId).toBe(senderId);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...pushDto,
        senderId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('markAsRead', () => {
    it('should mark multiple notifications as read', async () => {
      const notificationIds = ['uuid-1', 'uuid-2'];
      const agentId = 'agent-uuid';

      const mockNotifications = [
        { id: 'uuid-1', recipientId: 'agent-uuid' },
        { id: 'uuid-2', recipientId: 'agent-uuid' },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications as any);
      mockRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.markAsRead(notificationIds, agentId);

      expect(result).toEqual({ count: 2 });
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: notificationIds as any, isRead: false },
        { isRead: true, readAt: expect.any(Date) },
      );
    });

    it('should throw ForbiddenException if notifications belong to another agent', async () => {
      const notificationIds = ['uuid-1', 'uuid-2'];
      const agentId = 'agent-uuid-1';

      const mockNotifications = [
        { id: 'uuid-1', recipientId: 'agent-uuid-2' }, // Belongs to another agent
      ];

      mockRepository.find.mockResolvedValue(mockNotifications as any);

      await expect(service.markAsRead(notificationIds, agentId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const agentId = 'agent-uuid';
      mockRepository.update.mockResolvedValue({ affected: 10 });

      const result = await service.markAllAsRead(agentId);

      expect(result).toEqual({ count: 10 });
      expect(mockRepository.update).toHaveBeenCalledWith(
        { recipientId: agentId, isRead: false },
        { isRead: true, readAt: expect.any(Date) },
      );
    });
  });

  describe('findOne', () => {
    it('should return notification by id', async () => {
      const notificationId = 'uuid-notification';
      const agentId = 'agent-uuid';

      const mockNotification = {
        id: notificationId,
        recipientId: agentId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Task assigned',
      } as Notification;

      mockRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne(notificationId, agentId);

      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid', 'agent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if notification belongs to another agent', async () => {
      const mockNotification = {
        id: 'uuid',
        recipientId: 'other-agent-uuid',
      } as Notification;

      mockRepository.findOne.mockResolvedValue(mockNotification);

      await expect(
        service.findOne('uuid', 'my-agent-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createTaskAssignedNotification', () => {
    it('should create notification for task assignment', async () => {
      const task = {
        id: 'task-uuid',
        title: 'New Task',
        assigneeId: 'agent-uuid',
      };

      const mockNotification = {
        id: 'uuid-notification',
        recipientId: 'agent-uuid',
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        content: 'You have been assigned task "New Task".',
        relatedTaskId: 'task-uuid',
      } as Notification;

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createTaskAssignedNotification(task);

      expect(result).toEqual(mockNotification);
      expect(mockRepository.create).toHaveBeenCalledWith({
        recipientId: task.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        content: expect.stringContaining(task.title),
        relatedTaskId: task.id,
      });
    });

    it('should return null if task has no assignee', async () => {
      const task = {
        id: 'task-uuid',
        title: 'New Task',
        assigneeId: null,
      };

      const result = await service.createTaskAssignedNotification(task);

      expect(result).toBeNull();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('createTaskCompletedNotification', () => {
    it('should create notification for task completion', async () => {
      const task = {
        id: 'task-uuid',
        title: 'New Task',
        creatorId: 'agent-uuid',
      };

      const mockNotification = {
        id: 'uuid-notification',
        recipientId: 'agent-uuid',
        type: NotificationType.TASK_COMPLETED,
        title: 'Task completed',
        content: expect.stringContaining(task.title),
        relatedTaskId: 'task-uuid',
      } as Notification;

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createTaskCompletedNotification(task);

      expect(result).toEqual(mockNotification);
    });

    it('should return null if task has no creator', async () => {
      const task = {
        id: 'task-uuid',
        title: 'New Task',
        creatorId: null,
      };

      const result = await service.createTaskCompletedNotification(task);

      expect(result).toBeNull();
    });
  });

  describe('createCommentAddedNotification', () => {
    it('should create notification for comment addition', async () => {
      const comment = {
        id: 'comment-uuid',
        taskId: 'task-uuid',
        task: {
          id: 'task-uuid',
          title: 'New Task',
          creatorId: 'agent-uuid',
        },
        authorId: 'author-uuid',
      };

      const mockNotification = {
        id: 'uuid-notification',
        recipientId: 'agent-uuid',
        senderId: 'author-uuid',
        type: NotificationType.COMMENT_ADDED,
        title: 'New comment added',
        content: expect.stringContaining(comment.task.title),
        relatedTaskId: 'task-uuid',
        relatedCommentId: 'comment-uuid',
      } as Notification;

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createCommentAddedNotification(comment);

      expect(result).toEqual(mockNotification);
      expect(mockRepository.create).toHaveBeenCalledWith({
        recipientId: comment.task.creatorId,
        senderId: comment.authorId,
        type: NotificationType.COMMENT_ADDED,
        title: 'New comment added',
        content: expect.any(String),
        relatedTaskId: comment.taskId,
        relatedCommentId: comment.id,
      });
    });
  });

  describe('remove', () => {
    it('should remove a notification', async () => {
      const notification = { id: 'notif-1', recipientId: 'user-1' } as Notification;
      mockRepository.findOne.mockResolvedValue(notification);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove('notif-1', 'user-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(notification);
    });
  });
});
