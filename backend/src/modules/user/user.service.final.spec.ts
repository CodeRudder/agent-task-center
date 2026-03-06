import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

describe('UserService - Final Push', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    repository = mockRepository as any;
    service = new UserService(repository);
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-1';
      const updateDto = {
        name: 'Updated Name',
        avatar: 'avatar-url',
      };

      const mockUser = {
        id: userId,
        ...updateDto,
      };

      mockRepository.findOne.mockResolvedValue({ id: userId });
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
