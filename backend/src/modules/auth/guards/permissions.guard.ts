import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

// 角色权限映射
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin_agent: [
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'agent:create',
    'agent:read',
    'agent:update',
    'agent:delete',
    'comment:create',
    'comment:read',
    'notification:read',
  ],
  worker_agent: [
    'task:create',
    'task:read',
    'task:update',
    'comment:create',
    'comment:read',
    'notification:read',
  ],
  readonly_agent: [
    'task:read',
    'comment:read',
    'notification:read',
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // 无权限要求
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    // TODO: 临时修复 - admin用户跳过权限检查
    // 完整的RBAC权限系统将在后续版本实现
    if (user.role === 'admin') {
      return true;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
