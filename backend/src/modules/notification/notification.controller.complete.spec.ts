import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationType } from './dto/notification.dto';

describe('NotificationController - Complete Coverage', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    service = mockNotificationService as any;
    controller = new NotificationController(service);
  });

  describe('findAll', () => {
    it('should return notifications for user', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockNotifications = {
        items: [
          { id: 'notif-1', title: 'Notification 1' },
          { id: 'notif-2', title: 'Notification 2' },
        ],
        total: 2,
      };

      mockNotificationService.findAll.mockResolvedValue(mockNotifications);

      const result = await controller.findAll(mockRequest, {});

      expect(mockNotificationService.findAll).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('findOne', () => {
    it('should return single notification', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockNotification = { id: 'notif-1', title: 'Notification 1' };

      mockNotificationService.findOne.mockResolvedValue(mockNotification);

      const result = await controller.findOne('notif-1', mockRequest);

      expect(mockNotificationService.findOne).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(result).toEqual(mockNotification);
    });
  });

  describe('update', () => {
    it('should update notification title and content', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockNotification = { id: 'notif-1', title: 'Updated', content: 'Updated content' };

      mockNotificationService.update.mockResolvedValue(mockNotification);

      const result = await controller.update('notif-1', { title: 'Updated', content: 'Updated content' }, mockRequest);

      expect(mockNotificationService.update).toHaveBeenCalledWith('notif-1', { title: 'Updated', content: 'Updated content' }, 'user-1');
      expect(result).toEqual(mockNotification);
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const createDto = {
        recipientId: 'user-1',
        type: NotificationType.TASK_CREATED,
        title: 'Test',
        content: 'Test content',
      };

      const mockNotification = { id: 'notif-1', ...createDto };

      mockNotificationService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(createDto);

      expect(mockNotificationService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockNotification);
    });
  });
});
