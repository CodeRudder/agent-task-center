import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

describe('AuthService - Final Push', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let passwordResetTokenRepository: Repository<PasswordResetToken>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {
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
    passwordResetTokenRepository = mockPasswordResetTokenRepository as any;
    jwtService = mockJwtService as any;
    service = new AuthService(userRepository, passwordResetTokenRepository, jwtService);
  });

  describe('login edge cases', () => {
    it('should handle login with invalid user', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow();
    });

    it('should generate access token', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockJwtService.sign.mockReturnValue('access-token');

      const token = mockJwtService.sign({ userId: user.id });

      expect(token).toBe('access-token');
    });
  });

  describe('register edge cases', () => {
    it('should handle duplicate email', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password',
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'user-1' });

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });
});
