import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { mockRepository } from '@common/utils/mocks';

describe('UserService - Additional Coverage', () => {
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

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', displayName: 'User 1' },
        { id: '2', email: 'user2@example.com', displayName: 'User 2' },
      ];

      repository.findAndCount.mockResolvedValue([mockUsers, mockUsers.length]);

      const result = await service.findAll(1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toEqual(mockUsers.length);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', email: 'user@example.com', displayName: 'User' };

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: '1', email: 'user@example.com', displayName: 'User' };

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@example.com');

      expect(result).toEqual(mockUser);
    });
  });
});
