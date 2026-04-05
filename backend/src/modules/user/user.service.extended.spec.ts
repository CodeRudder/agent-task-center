import { UserService } from './user.service';
import { mockRepository } from '@common/utils/mocks';

describe('UserService - Extended Tests', () => {
  let service: UserService;
  let repository: any;
  let permissionRepository: any;
  let rolePermissionRepository: any;

  beforeEach(() => {
    repository = mockRepository();
    permissionRepository = mockRepository();
    rolePermissionRepository = mockRepository();
    service = new UserService(repository, permissionRepository, rolePermissionRepository);
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-001';
      const updateDto = {
        displayName: 'Updated Name',
        avatar: 'https://example.com/new-avatar.png',
      };

      repository.findOne.mockResolvedValue({ id: userId });
      repository.save.mockResolvedValue({ ...updateDto, id: userId });

      const result = await service.updateProfile(userId, updateDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.displayName).toBe('Updated Name');
    });
  });
});
