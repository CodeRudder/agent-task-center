import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService - Complete Coverage', () => {
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

  describe('getNotifications', () => {
    it('should return notifications with default limit', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1' },
        { id: 'notif-2', title: 'Notification 2' },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications('user-1');

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it('should return notifications with custom limit', async () => {
      const mockNotifications = [{ id: 'notif-1', title: 'Notification 1' }];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications('user-1', 5);

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.markAsRead('user-1', 'notif-1');

      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockRepository.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const notificationData = {
        userId: 'user-1',
        title: 'Test Notification',
        content: 'Test Content',
      };

      const mockNotification = {
        id: 'notif-1',
        ...notificationData,
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(notificationData);

      expect(mockRepository.create).toHaveBeenCalledWith(notificationData);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });
});
