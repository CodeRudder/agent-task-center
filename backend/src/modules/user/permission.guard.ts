import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

export const PERMISSION_KEY = 'permission';

/**
 * 权限装饰器元数据
 */
export interface PermissionMetadata {
  resource: string;
  action: string;
}

/**
 * 权限守卫 - 检查用户是否有对应的权限
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取权限元数据
    const permissionMetadata = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有权限元数据，则允许访问（不需要权限验证）
    if (!permissionMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果用户未登录，拒绝访问
    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 查询用户的角色权限
    const { resource, action } = permissionMetadata;
    const permission = await this.permissionRepository.findOne({
      where: { resourceType: resource, action },
    });

    if (!permission) {
      // 权限不存在，拒绝访问
      throw new ForbiddenException('权限不存在');
    }

    // 检查用户角色是否有该权限
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        role: user.role,
        permissionId: permission.id,
      },
    });

    if (!rolePermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}

/**
 * 权限装饰器
 */
import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { resource, action });
