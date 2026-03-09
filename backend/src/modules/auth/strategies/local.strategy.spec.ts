import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    authService = mockAuthService as any;
    strategy = new LocalStrategy(authService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-001',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate('testuser', 'password123');

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('testuser', 'wrongpassword')).rejects.toThrow();
    });
  });
});
