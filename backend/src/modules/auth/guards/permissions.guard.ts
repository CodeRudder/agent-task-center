import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    if (user.role === 'admin') {
      return true;
    }

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
        'notification:push',
      ],
      worker_agent: [
        'task:create',
        'task:read',
        'task:update',
        'comment:create',
        'comment:read',
        'notification:read',
        'notification:push',
      ],
      readonly_agent: [
        'task:read',
        'comment:read',
        'notification:read',
      ],
    };

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = requiredPermissions.every((permission: string) =>
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
