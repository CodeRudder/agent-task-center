import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
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

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情（包含权限列表）' })
  @ApiResponse({ status: 200, description: '成功', type: UserDetailResponseDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailResponseDto> {
    return this.userService.getUserWithPermissions(id);
  }

  @Put(':id/role')
  @ApiOperation({ summary: '更新用户角色' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.userService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新用户状态' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.userService.updateUserStatus(id, updateUserStatusDto.status);
  }
}
