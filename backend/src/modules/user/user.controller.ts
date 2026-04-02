import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import {
  UserQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto';
import {
  UserListResponseDto,
  UserDetailResponseDto,
} from './dto/user-response.dto';
import { PermissionGuard, RequirePermission } from './permission.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '成功' })
  async getCurrentUser(@Request() req: any): Promise<User> {
    return this.userService.findById(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表（分页、筛选、搜索）' })
  @ApiResponse({ status: 200, description: '成功', type: UserListResponseDto })
  async findAll(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
    return this.userService.findAllWithPagination(query);
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('user', 'create')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async create(
    @Body() userData: Partial<User>,
  ): Promise<User> {
    return this.userService.create(userData);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('user', 'delete')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.userService.delete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情（包含权限列表）' })
  @ApiResponse({ status: 200, description: '成功', type: UserDetailResponseDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailResponseDto> {
    return this.userService.getUserWithPermissions(id);
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('user', 'update')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<User>,
  ): Promise<User> {
    return this.userService.updateProfile(id, updateData);
  }

  @Put(':id/role')
  @UseGuards(PermissionGuard)
  @RequirePermission('user', 'update')
  @ApiOperation({ summary: '更新用户角色' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.userService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Put(':id/status')
  @UseGuards(PermissionGuard)
  @RequirePermission('user', 'update')
  @ApiOperation({ summary: '更新用户状态' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.userService.updateUserStatus(id, updateUserStatusDto.status);
  }
}
