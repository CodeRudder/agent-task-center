import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Repository } from 'typeorm';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findById: jest.fn(),
    findAllWithPagination: jest.fn(),
  };

  const mockPermissionRepository = {
    findOne: jest.fn(),
  };

  const mockRolePermissionRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
      ],
    })
    .overrideGuard(require('../user/permission.guard.ts'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = {
        user: {
          id: 'user-001',
        },
      };

      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockRequest);

      expect(mockUserService.findById).toHaveBeenCalledWith('user-001');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedResult = [
        {
          id: 'user-001',
          email: 'test1@example.com',
          name: 'User 1',
          role: 'user',
        },
        {
          id: 'user-002',
          email: 'test2@example.com',
          name: 'User 2',
          role: 'user',
        },
      ];

      mockUserService.findAllWithPagination.mockResolvedValue(expectedResult);

      const result = await controller.findAll({});

      expect(mockUserService.findAllWithPagination).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
