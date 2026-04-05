import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController - Complete Coverage', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(() => {
    service = mockAuthService as any;
    controller = new AuthController(service);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const mockResponse = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: registerDto.email,
          name: registerDto.name,
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockResponse = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: loginDto.email,
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      };

      mockRequest.user = mockUser;

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });
});
