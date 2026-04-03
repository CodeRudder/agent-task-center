import { NotificationService } from './notification.service';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './dto/notification.dto';

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
    createQueryBuilder: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    service = new NotificationService(repository);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notificationData = {
        recipientId: 'user-1',
        type: NotificationType.TASK_CREATED as const,
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

  describe('findAll', () => {
    it('should return user notifications', async () => {
      const queryDto = { page: 1, pageSize: 10 };
      const mockNotifications = [
        { id: 'notif-1', recipientId: 'user-1', title: 'Test 1' },
        { id: 'notif-2', recipientId: 'user-1', title: 'Test 2' },
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

      const result = await service.findAll('user-1', queryDto);

      expect(result.items).toEqual(mockNotifications);
      expect(result.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return single notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        recipientId: 'user-1',
        title: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('notif-1', 'user-1');

      expect(result).toEqual(mockNotification);
    });
  });
});
  });
});
