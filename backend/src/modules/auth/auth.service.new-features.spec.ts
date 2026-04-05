import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { mockRepository, MockDataSource, mockJwtService } from '@common/utils/mocks';

describe('AuthService - New Features', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-001',
    email: 'test@example.com',
    password: 'hashedpassword',
    displayName: 'Test User',
    username: 'testuser',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockRepository(),
        },
        {
          provide: DataSource,
          useValue: MockDataSource,
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('getCurrentUser', () => {
    it('should return current user information', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser('user-001');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-001');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.username).toBe('testuser');
      expect(result.role).toBe('user');
      expect(result.isActive).toBe(true);
    });

    it('should throw error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCurrentUser('nonexistent'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockPayload = {
        sub: 'user-001',
        email: 'test@example.com',
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if refresh token type is not refresh', async () => {
      const mockPayload = {
        sub: 'user-001',
        email: 'test@example.com',
        type: 'access', // Not refresh
      };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.refreshToken('access-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user not found', async () => {
      const mockPayload = {
        sub: 'user-001',
        email: 'test@example.com',
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user is inactive', async () => {
      const mockPayload = {
        sub: 'user-001',
        email: 'test@example.com',
        type: 'refresh',
      };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.refreshToken('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await service.logout('user-001');

      expect(result).toEqual({
        message: '登出成功',
      });
    });
  });

  describe('Brute Force Protection', () => {
    const testEmail = 'test@example.com';

    beforeEach(() => {
      // Clear login attempts before each test
      (service as any).loginAttempts.clear();
    });

    it('should lock account after 5 failed attempts', async () => {
      // Mock user found
      userRepository.findOne.mockResolvedValue(mockUser);
      // Mock password verification failed
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        try {
          await service.login({
            email: testEmail,
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      }

      // 6th attempt should be locked
      await expect(
        service.login({
          email: testEmail,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(/账户已被锁定/);
    });

    it('should clear failed attempts on successful login', async () => {
      // Mock user found
      userRepository.findOne.mockResolvedValue(mockUser);

      // Make 3 failed attempts
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      for (let i = 0; i < 3; i++) {
        try {
          await service.login({
            email: testEmail,
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      }

      // Verify failed attempts recorded
      const attempts = (service as any).loginAttempts.get(testEmail);
      expect(attempts.count).toBe(3);

      // Successful login
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      await service.login({
        email: testEmail,
        password: 'correctpassword',
      });

      // Verify failed attempts cleared
      expect((service as any).loginAttempts.has(testEmail)).toBe(false);
    });

    it('should unlock account after lock time expires', async () => {
      // Mock user found
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Make 5 failed attempts to lock account
      for (let i = 0; i < 5; i++) {
        try {
          await service.login({
            email: testEmail,
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      }

      // Verify account is locked
      const attempts = (service as any).loginAttempts.get(testEmail);
      expect(attempts.lockUntil).toBeGreaterThan(Date.now());

      // Simulate time travel (15 minutes later)
      const originalLockUntil = attempts.lockUntil;
      attempts.lockUntil = Date.now() - 1; // Set to past

      // Should be able to login again (but will still fail due to wrong password)
      await expect(
        service.login({
          email: testEmail,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(/用户名或密码错误/); // Not locked anymore
    });

    it('should track failed attempts separately for different emails', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // 3 failed attempts for email1
      for (let i = 0; i < 3; i++) {
        try {
          await service.login({
            email: email1,
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected
        }
      }

      // 2 failed attempts for email2
      for (let i = 0; i < 2; i++) {
        try {
          await service.login({
            email: email2,
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected
        }
      }

      // Verify separate tracking
      expect((service as any).loginAttempts.get(email1).count).toBe(3);
      expect((service as any).loginAttempts.get(email2).count).toBe(2);
    });
  });
});
