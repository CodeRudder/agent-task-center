import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../user/entities/permission.entity';
import { RolePermission } from '../user/entities/role-permission.entity';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionTestController } from './permission-test.controller';

/**
 * 权限测试模块
 * 
 * 功能：
 * - 提供权限测试端点
 * - 用于验证权限守卫功能
 * 
 * 注意：
 * - 不导入UserModule避免循环依赖
 * - 直接使用TypeOrmModule.forFeature注册Permission和RolePermission实体
 */
@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission])],
  controllers: [PermissionTestController],
  providers: [PermissionsGuard],
})
export class PermissionModule {}
