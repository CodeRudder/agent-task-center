import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import {
  PermissionListResponseDto,
  RoleListResponseDto,
} from './dto/permission-response.dto';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({ status: 200, description: '成功', type: PermissionListResponseDto })
  async getPermissions(): Promise<PermissionListResponseDto> {
    return this.permissionService.getPermissions();
  }
}

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '成功', type: RoleListResponseDto })
  async getRoles(): Promise<RoleListResponseDto> {
    return this.permissionService.getRoles();
  }
}
