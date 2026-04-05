import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { mockRepository } from '@common/utils/mocks';

describe('UserService - Final Push', () => {
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

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-1';
      const updateDto = {
        displayName: 'Updated Name',
        avatar: 'avatar-url',
      };

      const mockUser = {
        id: userId,
        ...updateDto,
      };

      repository.findOne.mockResolvedValue({ id: userId });
      repository.save.mockResolvedValue(mockUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(repository.save).toHaveBeenCalled();
    });
  });
});
