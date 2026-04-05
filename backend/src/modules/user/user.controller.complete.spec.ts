import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController - Complete Coverage', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    findAllWithPagination: jest.fn(),
    update: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(() => {
    service = mockUserService as any;
    controller = new UserController(service);
  });

  describe('getCurrentUser', () => {
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

      const result = await controller.getCurrentUser(mockRequest);

      expect(mockUserService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = {
        items: [
          { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
          { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      mockUserService.findAllWithPagination.mockResolvedValue(mockUsers);

      const result = await controller.findAll({});

      expect(mockUserService.findAllWithPagination).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should update user profile', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const updateDto = {
        username: 'Updated Name',
      };

      const mockUpdatedUser = {
        id: 'user-1',
        username: 'Updated Name',
      };

      mockUserService.updateProfile.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update('user-1', updateDto as any);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user-1', updateDto);
      expect(result).toEqual(mockUpdatedUser);
    });
  });
});
