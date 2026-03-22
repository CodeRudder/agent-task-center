import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

/**
 * 权限测试Controller
 * 
 * 用于测试权限守卫功能
 */
@Controller('test/permissions')
@UseGuards(PermissionsGuard)
export class PermissionTestController {
  /**
   * 测试task_view权限
   * 需要权限：task_view
   */
  @Get('task-view')
  @RequirePermissions('task_view')
  testTaskView() {
    return {
      message: 'task_view permission check passed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试task_edit权限
   * 需要权限：task_edit
   */
  @Get('task-edit')
  @RequirePermissions('task_edit')
  testTaskEdit() {
    return {
      message: 'task_edit permission check passed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试user_manage权限
   * 需要权限：user_manage（只有admin角色有）
   */
  @Get('user-manage')
  @RequirePermissions('user_manage')
  testUserManage() {
    return {
      message: 'user_manage permission check passed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试多个权限（同时需要task_view和task_edit）
   * 需要权限：task_view + task_edit
   */
  @Get('multiple')
  @RequirePermissions('task_view', 'task_edit')
  testMultiplePermissions() {
    return {
      message: 'Multiple permissions check passed (task_view + task_edit)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试无权限要求的路由
   * 不需要特定权限，只需要登录
   */
  @Get('no-permission')
  testNoPermission() {
    return {
      message: 'No specific permission required',
      timestamp: new Date().toISOString(),
    };
  }
}
