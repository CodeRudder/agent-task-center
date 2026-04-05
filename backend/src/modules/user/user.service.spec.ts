import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Repository } from 'typeorm';
import { mockRepository } from '@common/utils/mocks';

describe('UserService', () => {
  let service: UserService;
  let userRepository: any;

  const mockUser = {
    id: 'user-001',
    email: 'test@example.com',
    displayName: 'Test User',
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
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRepository(),
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

    it('should create user successfully', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      };

      userRepository.create.mockReturnValue({ ...createUserDto, id: 'user-002' });
      userRepository.save.mockResolvedValue({ ...createUserDto, id: 'user-002' });

      const result = await service.create(createUserDto);
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, users.length]);

      const result = await service.findAll(1, 10);
      expect(result.users).toEqual(users);
      expect(result.total).toEqual(users.length);
    });

    it('should return empty array if no users', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(1, 10);
      expect(result.users).toEqual([]);
      expect(result.total).toEqual(0);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-001');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('User not found');
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

  describe('updateProfile', () => {
    it('should update user successfully', async () => {
      const updateDto = {
        displayName: 'Updated Name',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.updateProfile('user-001', updateDto);
      expect(result.displayName).toBe('Updated Name');
    });

    it('should throw error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent', {})).rejects.toThrow('User not found');
    });
  });
});
