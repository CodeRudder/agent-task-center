import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserService - Edge Cases', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    service = new UserService(repository);
  });

  describe('findById - NotFoundException', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return null if email not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should return user if email found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Old Name',
      };

      const updateData = {
        name: 'New Name',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.updateProfile('user-1', updateData);

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException if user not found during update', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent-id', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return users with selected fields', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'name', 'role', 'createdAt'],
      });
      expect(result).toEqual(mockUsers);
    });
  });
});
