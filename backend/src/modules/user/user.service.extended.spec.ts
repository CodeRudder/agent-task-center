import { UserService } from './user.service';

describe('UserService - Extended Tests', () => {
  let service: UserService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    service = new UserService(mockRepository);
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-001';
      const updateDto = {
        name: 'Updated Name',
        avatar: 'https://example.com/new-avatar.png',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateProfile(userId, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const userId = 'user-001';
      const newPassword = 'newhashedpassword';

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changePassword(userId, newPassword);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        password: newPassword,
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const userId = 'user-001';

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.deactivate(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        isActive: false,
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate a user', async () => {
      const userId = 'user-001';

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.activate(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        isActive: true,
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });

  describe('findByFeishuOpenId', () => {
    it('should find user by Feishu Open ID', async () => {
      const mockUser = {
        id: 'user-001',
        feishuOpenId: 'feishu-123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByFeishuOpenId('feishu-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { feishuOpenId: 'feishu-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('count', () => {
    it('should return total user count', async () => {
      mockRepository.count.mockResolvedValue(100);

      const result = await service.count();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(100);
    });
  });

  describe('countActive', () => {
    it('should return active user count', async () => {
      mockRepository.count.mockResolvedValue(85);

      const result = await service.countActive();

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toBe(85);
    });
  });
});
