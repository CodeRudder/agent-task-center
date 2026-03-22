import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { PermissionService } from './permission.service';
import { UserController } from './user.controller';
import {
  PermissionController,
  RoleController,
} from './permission.controller';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserOperationLog } from './entities/user-operation-log.entity';
import { UserPreference } from './entities/user-preference.entity';
import { PermissionGuard } from './permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Permission,
      RolePermission,
      UserOperationLog,
      UserPreference,
    ]),
  ],
  controllers: [UserController, PermissionController, RoleController],
  providers: [UserService, PermissionService, PermissionGuard],
  exports: [UserService, PermissionService],
})
export class UserModule {}
