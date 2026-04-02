import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseBoolPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';

// Simple interface for request with user
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async create(@Body() createRoleDto: CreateRoleDto, @Req() req: RequestWithUser) {
    const userId = req.user?.userId || (req.user as any).id;
    return this.roleService.create(createRoleDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll(
    @Query('isSystem', new ParseBoolPipe({ optional: true })) isSystem?: boolean,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.roleService.findAll({ isSystem, page, pageSize });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role details' })
  @ApiResponse({ status: 200, description: 'Role details retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':roleId/assign')
  @ApiOperation({ summary: 'Assign role to users' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  async assignToUsers(@Param('roleId') roleId: string, @Body() assignRoleDto: AssignRoleDto) {
    return this.roleService.assignToUsers(roleId, assignRoleDto);
  }

  @Delete(':roleId/assign/:userId')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  async removeFromUser(@Param('roleId') roleId: string, @Param('userId') userId: string) {
    return this.roleService.removeFromUser(roleId, userId);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  async assignPermissions(@Param('id') id: string, @Body() assignPermissionsDto: AssignPermissionsDto) {
    return this.roleService.assignPermissions(id, assignPermissionsDto);
  }

  @Get('permissions/list')
  @ApiOperation({ summary: 'Get available permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getPermissions() {
    return this.roleService.getPermissions();
  }
}
