import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { NotFoundException } from '@nestjs/common';
import { mockRepository } from '@common/utils/mocks';

describe('UserService - Edge Cases', () => {
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

  describe('findById - NotFoundException', () => {
    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return null if email not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should return user if email found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Test User',
      };

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Old Name',
      };

      const updateData = {
        displayName: 'New Name',
      };

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.updateProfile('user-1', updateData);

      expect(result.displayName).toBe('New Name');
    });

    it('should throw NotFoundException if user not found during update', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent-id', { displayName: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return users with selected fields', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', displayName: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', displayName: 'User 2' },
      ];

      repository.findAndCount.mockResolvedValue([mockUsers, mockUsers.length]);

      const result = await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        select: ['id', 'email', 'displayName', 'role', 'createdAt'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.users).toEqual(mockUsers);
    });
  });
});
