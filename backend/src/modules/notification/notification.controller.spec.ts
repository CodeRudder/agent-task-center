import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return user notifications with default limit', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      const expectedResult = [
        {
          id: 'notif-001',
          userId: 'user-001',
          title: 'Notification 1',
          content: 'Content 1',
          isRead: false,
        },
      ];

      mockNotificationService.getNotifications.mockResolvedValue(expectedResult);

      const result = await controller.getNotifications(mockRequest);

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-001', 20);
      expect(result).toEqual(expectedResult);
    });

    it('should return user notifications with custom limit', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      const expectedResult = [];

      mockNotificationService.getNotifications.mockResolvedValue(expectedResult);

      const result = await controller.getNotifications(mockRequest, 10);

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-001', 10);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      mockNotificationService.markAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead('notif-001', mockRequest);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('user-001', 'notif-001');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(mockRequest);

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-001');
      expect(result).toEqual({ count: 5 });
    });
  });
});
