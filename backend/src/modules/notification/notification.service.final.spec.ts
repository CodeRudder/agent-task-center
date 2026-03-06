import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

describe('NotificationService - Final Push', () => {
  let service: NotificationService;
  let repository: Repository<Notification>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    service = new NotificationService(repository);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notificationData = {
        userId: 'user-1',
        title: 'Test',
        content: 'Content',
      };

      const mockNotification = {
        id: 'notif-1',
        ...notificationData,
        isRead: false,
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(notificationData);

      expect(result).toEqual(mockNotification);
    });
  });

  describe('findByUserId', () => {
    it('should return user notifications', async () => {
      const userId = 'user-1';
      const mockNotifications = [
        { id: 'notif-1', userId, title: 'Test 1' },
        { id: 'notif-2', userId, title: 'Test 2' },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-1';

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.markAsRead(notificationId);

      expect(mockRepository.update).toHaveBeenCalledWith(notificationId, { isRead: true });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const userId = 'user-1';

      mockRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead(userId);

      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const userId = 'user-1';

      mockRepository.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(3);
    });
  });
});
