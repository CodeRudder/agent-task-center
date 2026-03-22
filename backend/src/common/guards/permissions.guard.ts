import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolePermission } from '../../modules/user/entities/role-permission.entity';

/**
 * 权限守卫 - 基于RBAC模型的权限检查
 * 
 * 功能：
 * 1. 从JWT token中提取用户角色
 * 2. 从数据库查询角色的权限列表
 * 3. 检查用户是否有访问资源所需的权限
 * 
 * TODO: 后续添加Redis缓存优化
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 获取所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有权限要求，直接通过
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. 获取用户信息（从JWT token注入的request.user）
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    // 3. 获取用户角色的权限列表
    const userPermissions = await this.getUserPermissions(user.role);

    // 4. 检查是否拥有所需权限
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.id} with role ${user.role} lacks required permissions: ${requiredPermissions.join(', ')}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * 获取用户角色的所有权限（直接查询数据库）
   * 
   * TODO: 添加Redis缓存优化
   */
  private async getUserPermissions(role: string): Promise<string[]> {
    try {
      // 从数据库查询权限
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { role },
        relations: ['permission'],
      });

      const permissions = rolePermissions.map((rp) => rp.permission.name);

      this.logger.debug(
        `Permissions for role ${role}: ${permissions.join(', ')}`,
      );

      return permissions;
    } catch (error) {
      this.logger.error(
        `Failed to get permissions for role ${role}:`,
        error.stack,
      );
      // 查询失败时返回空权限列表（安全策略）
      return [];
    }
  }
}
