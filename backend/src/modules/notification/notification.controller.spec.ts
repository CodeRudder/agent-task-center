import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationType } from './dto/notification.dto';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
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

  describe('findAll', () => {
    it('should return user notifications with default pagination', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      const expectedResult = {
        items: [
          {
            id: 'notif-001',
            recipientId: 'user-001',
            title: 'Notification 1',
            content: 'Content 1',
            isRead: false,
          },
        ],
        total: 1,
      };

      mockNotificationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockRequest, {});

      expect(mockNotificationService.findAll).toHaveBeenCalledWith('user-001', {});
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return single notification', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      const expectedResult = {
        id: 'notif-001',
        recipientId: 'user-001',
        title: 'Notification 1',
      };

      mockNotificationService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('notif-001', mockRequest);

      expect(mockNotificationService.findOne).toHaveBeenCalledWith('notif-001', 'user-001');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update notification', async () => {
      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      const updateDto = {
        title: 'Updated title',
        content: 'Updated content',
      };

      const expectedResult = {
        id: 'notif-001',
        ...updateDto,
      };

      mockNotificationService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('notif-001', updateDto, mockRequest);

      expect(mockNotificationService.update).toHaveBeenCalledWith('notif-001', updateDto, 'user-001');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const createDto = {
        recipientId: 'user-002',
        type: NotificationType.TASK_CREATED,
        title: 'New notification',
        content: 'Notification content',
      };

      const expectedResult = {
        id: 'notif-001',
        ...createDto,
      };

      mockNotificationService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(mockNotificationService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
