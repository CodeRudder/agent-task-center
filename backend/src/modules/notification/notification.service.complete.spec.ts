import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from './dto/notification.dto';

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
    createQueryBuilder: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    service = new NotificationService(repository);
  });

  describe('findAll', () => {
    it('should return notifications with default pagination', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1' },
        { id: 'notif-2', title: 'Notification 2' },
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotifications),
        getCount: jest.fn().mockResolvedValue(2),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll('user-1', {});

      expect(result.items).toEqual(mockNotifications);
      expect(result.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return notification if exists and belongs to user', async () => {
      const mockNotification = {
        id: 'notif-1',
        recipientId: 'user-1',
        title: 'Test Notification',
      };

      mockRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('notif-1', 'user-1');

      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        recipientId: 'user-1',
        isRead: false,
      };

      mockRepository.findOne.mockResolvedValue(mockNotification);
      mockRepository.save.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await service.update('notif-1', { isRead: true }, 'user-1');

      expect(result.isRead).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const notificationData = {
        recipientId: 'user-1',
        type: NotificationType.TASK_CREATED,
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
