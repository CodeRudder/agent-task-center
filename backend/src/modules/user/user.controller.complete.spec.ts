import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController - Complete Coverage', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(() => {
    service = mockUserService as any;
    controller = new UserController(service);
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      };

      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(mockUserService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
      ];

      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const updateDto = {
        name: 'Updated Name',
      };

      const mockUpdatedUser = {
        id: 'user-1',
        name: 'Updated Name',
      };

      mockUserService.updateProfile.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-1', updateDto);
      expect(result).toEqual(mockUpdatedUser);
    });
  });
});
