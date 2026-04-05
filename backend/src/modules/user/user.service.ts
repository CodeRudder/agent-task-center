import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserQueryDto, UserRole, UserStatus } from './dto';
import {
  UserListResponseDto,
  UserDetailResponseDto,
} from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'email', 'displayName', 'role', 'createdAt'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  async updateProfile(
    id: string,
    updateData: Partial<User>,
  ): Promise<User> {
    try {
      const user = await this.findById(id);
      Object.assign(user, updateData);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user profile');
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({ 
        where: { email: userData.email } 
      });
      
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      const user = this.userRepository.create(userData);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const user = await this.findById(id);
      await this.userRepository.remove(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete user');
    }
  }

  /**
   * 分页查询用户（支持筛选和搜索）
   */
  async findAllWithPagination(query: UserQueryDto): Promise<UserListResponseDto> {
    try {
      const { page = 1, pageSize = 20, role, status, search } = query;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // 角色筛选
      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      // 状态筛选
      if (status) {
        if (status === 'active') {
          queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
        } else if (status === 'disabled') {
          queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
        }
      }

      // 搜索（用户名或邮箱）
      if (search) {
        queryBuilder.andWhere(
          '(user.username ILIKE :search OR user.email ILIKE :search OR user.displayName ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // 排序和分页
      queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(pageSize);

      // 执行查询
      const [users, total] = await queryBuilder.getManyAndCount();

      return {
        users: users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.isActive ? 'active' : 'disabled',
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch users');
    }
  }

  /**
   * 更新用户角色
   */
  async updateUserRole(id: string, role: UserRole): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findById(id);
      user.role = role;
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Role updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user role');
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findById(id);
      user.isActive = status === 'active';
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Status updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user status');
    }
  }

  /**
   * 获取用户及其权限列表
   */
  async getUserWithPermissions(id: string): Promise<UserDetailResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 获取用户权限（基于角色）
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { role: user.role },
        relations: ['permission'],
      });

      // 转换为DTO格式
      const permissions = rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resourceType,
        action: rp.permission.action,
        description: rp.permission.description,
      }));

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.isActive ? 'active' : 'disabled',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        permissions,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch user details');
    }
  }
}
