import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController - Complete Coverage', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    service = mockNotificationService as any;
    controller = new NotificationController(service);
  });

  describe('getNotifications', () => {
    it('should return notifications for user', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1' },
        { id: 'notif-2', title: 'Notification 2' },
      ];

      mockNotificationService.getNotifications.mockResolvedValue(mockNotifications);

      const result = await controller.getNotifications(mockRequest, 20);

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user-1', 20);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const notificationId = 'notif-1';

      await controller.markAsRead(notificationId, mockRequest);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('user-1', notificationId);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(mockRequest);

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ count: 5 });
    });
  });
});
