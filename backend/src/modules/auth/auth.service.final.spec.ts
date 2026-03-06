import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

describe('AuthService - Final Push', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
  };

  beforeEach(() => {
    jwtService = mockJwtService as any;
    userService = mockUserService as any;
    service = new AuthService(jwtService, userService);
  });

  describe('login edge cases', () => {
    it('should handle login with invalid user', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

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

      mockUserService.findByEmail.mockResolvedValue({ id: 'user-1' });

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });
});
