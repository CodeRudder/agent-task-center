import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

describe('NotificationService - Additional Coverage', () => {
  let service: NotificationService;
  let repository: Repository<Notification>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    service = new NotificationService(repository);
  });

  describe('findAll', () => {
    it('should return all notifications for user', async () => {
      const mockNotifications = [
        { id: '1', userId: 'user-1', title: 'Notif 1' },
        { id: '2', userId: 'user-1', title: 'Notif 2' },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications('user-1', 20);

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.markAsRead('user-1', 'notif-1');

      expect(mockRepository.update).toHaveBeenCalled();
    });
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
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(notificationData);

      expect(result).toEqual(mockNotification);
    });
  });
});
