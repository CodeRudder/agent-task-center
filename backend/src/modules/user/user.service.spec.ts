import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 'user-001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    avatar: null,
    feishuOpenId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);
      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw error if email already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [mockUser];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
    });

    it('should return empty array if no users', async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-001');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if email not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = {
        name: 'Updated Name',
        role: 'admin',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update('user-001', updateDto);
      expect(result.name).toBe('Updated Name');
      expect(result.role).toBe('admin');
    });

    it('should throw error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete('user-001');
      expect(userRepository.delete).toHaveBeenCalledWith('user-001');
    });

    it('should throw error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should activate user', async () => {
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateStatus('user-001', true);
      expect(userRepository.update).toHaveBeenCalledWith('user-001', {
        isActive: true,
      });
    });

    it('should deactivate user', async () => {
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateStatus('user-001', false);
      expect(userRepository.update).toHaveBeenCalledWith('user-001', {
        isActive: false,
      });
    });
  });
});
