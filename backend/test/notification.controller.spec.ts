import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../src/modules/notification/notification.controller';
import { NotificationService } from '../src/modules/notification/notification.service';
import { QueryNotificationDto } from '../src/modules/notification/dto/notification.dto';
import { ApiTokenService } from '../src/modules/agents/services/api-token.service';
import { JwtService } from '@nestjs/jwt';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';

  const mockNotification = {
    id: mockNotificationId,
    agentId: mockUserId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    content: 'You have been assigned to a new task',
    data: { taskId: 'task-123' },
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: { id: mockUserId },
  };

  const mockService = {
    findByAgent: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    create: jest.fn(),
  };

  const mockApiTokenService = {
    validateApiToken: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockService,
        },
        {
          provide: ApiTokenService,
          useValue: mockApiTokenService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(require('../src/modules/auth/guards/api-token.guard'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../src/modules/auth/guards/permissions.guard'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should get notifications list successfully', async () => {
      const query: QueryNotificationDto = { page: 1, pageSize: 20 };
      const mockResult = {
        items: [mockNotification],
        total: 1,
        unreadCount: 1,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(mockService.findByAgent).toHaveBeenCalledWith(mockUserId, query);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });

    it('should return paginated results', async () => {
      const query: QueryNotificationDto = { page: 2, pageSize: 10 };
      const notifications = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockNotification,
          id: `notification-${i}`,
          title: `Notification ${i}`,
        }));

      const mockResult = {
        items: notifications,
        total: 25,
        unreadCount: 15,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.data.items).toHaveLength(10);
      expect(result.data.total).toBe(25);
      expect(result.data.unreadCount).toBe(15);
    });

    it('should filter by read status', async () => {
      const query: QueryNotificationDto = { 
        page: 1, 
        pageSize: 20, 
        readStatus: 'false' 
      };

      const mockResult = {
        items: [mockNotification],
        total: 1,
        unreadCount: 1,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(mockService.findByAgent).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ readStatus: 'false' }),
      );
      expect(result.data.items).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      const query: QueryNotificationDto = { page: 1, pageSize: 20 };
      const mockResult = {
        items: [],
        total: 0,
        unreadCount: 0,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
      expect(result.data.unreadCount).toBe(0);
    });

    it('should include timestamp in response', async () => {
      const query: QueryNotificationDto = {};
      const mockResult = {
        items: [mockNotification],
        total: 1,
        unreadCount: 1,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return unread count', async () => {
      const query: QueryNotificationDto = {};
      const mockResult = {
        items: [mockNotification, { ...mockNotification, read: true }],
        total: 2,
        unreadCount: 1,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.data.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const readNotification = {
        ...mockNotification,
        read: true,
      };

      mockService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead(
        mockNotificationId,
        mockRequest,
      );

      expect(mockService.markAsRead).toHaveBeenCalledWith(
        mockNotificationId,
        mockUserId,
      );
      expect(result.success).toBe(true);
      expect(result.data.read).toBe(true);
      expect(result.message).toBe('通知已标记为已读');
    });

    it('should include timestamp in response', async () => {
      const readNotification = {
        ...mockNotification,
        read: true,
      };

      mockService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead(
        mockNotificationId,
        mockRequest,
      );

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle already read notification', async () => {
      const alreadyReadNotification = {
        ...mockNotification,
        read: true,
      };

      mockService.markAsRead.mockResolvedValue(alreadyReadNotification);

      const result = await controller.markAsRead(
        mockNotificationId,
        mockRequest,
      );

      expect(result.success).toBe(true);
      expect(result.data.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockRequest);

      expect(mockService.markAllAsRead).toHaveBeenCalledWith(mockUserId);
      expect(result.success).toBe(true);
      expect(result.message).toBe('所有通知已标记为已读');
    });

    it('should include timestamp in response', async () => {
      mockService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockRequest);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    it('should handle notifications with complex data', async () => {
      const query: QueryNotificationDto = {};
      const complexNotification = {
        ...mockNotification,
        data: {
          taskId: 'task-123',
          metadata: {
            priority: 'high',
            labels: ['urgent', 'backend'],
          },
        },
      };

      const mockResult = {
        items: [complexNotification],
        total: 1,
        unreadCount: 1,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.data.items[0].data).toEqual(complexNotification.data);
    });

    it('should handle different notification types', async () => {
      const query: QueryNotificationDto = {};
      const notifications = [
        { ...mockNotification, type: 'task_assigned' },
        { ...mockNotification, type: 'comment_mention' },
        { ...mockNotification, type: 'task_completed' },
      ];

      const mockResult = {
        items: notifications,
        total: 3,
        unreadCount: 3,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.data.items).toHaveLength(3);
      expect(result.data.items.map(n => n.type)).toEqual([
        'task_assigned',
        'comment_mention',
        'task_completed',
      ]);
    });

    it('should handle large page numbers', async () => {
      const query: QueryNotificationDto = { page: 100, pageSize: 20 };
      const mockResult = {
        items: [],
        total: 50,
        unreadCount: 10,
      };

      mockService.findByAgent.mockResolvedValue(mockResult);

      const result = await controller.getNotifications(query, mockRequest);

      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(50);
    });
  });
});
