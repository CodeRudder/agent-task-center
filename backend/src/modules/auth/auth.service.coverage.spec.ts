import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService - Additional Coverage', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(() => {
    userRepository = mockUserRepository as any;
    jwtService = mockJwtService as any;
    service = new AuthService(userRepository, jwtService);
  });

  describe('validateUser', () => {
    it('should return user if user exists and is active', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('999');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        isActive: false,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: '$2b$10$abc123...', // bcrypt hash
        name: 'Test User',
        role: 'user',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      // Mock bcrypt.compare to return true
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return access token', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const mockUser = {
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        role: 'user',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(registerDto.email);
    });
  });
});
