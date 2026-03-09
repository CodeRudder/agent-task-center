import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-001',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$testhashedpassword',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-access-token'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });
      userRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });

      const result = await service.register(registerDto);
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
    });

    it('should throw error if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow();
    });

    it('should throw error if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow();
    });

    it('should throw error if user is deactivated', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.login(loginDto)).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return user if found and active', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-001');
      expect(result).toBeDefined();
      expect(result?.id).toBe('user-001');
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser);

      const result = await service.validateUser('user-001');
      expect(result).toBeNull();
    });
  });
});
