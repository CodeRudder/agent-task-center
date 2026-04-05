import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async create(createRoleDto: CreateRoleDto, userId: string): Promise<Role> {
    // Check if role name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    const role = this.roleRepository.create({
      ...createRoleDto,
      createdBy: userId,
    });

    return this.roleRepository.save(role);
  }

  async findAll(options: {
    isSystem?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Role[]; total: number }> {
    const { isSystem, page = 1, pageSize = 20 } = options;

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (isSystem !== undefined) {
      queryBuilder.andWhere('role.isSystem = :isSystem', { isSystem });
    }

    const [items, total] = await queryBuilder
      .orderBy('role.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Check if trying to update system role
    if (role.isSystem) {
      throw new BadRequestException('Cannot update system role');
    }

    // Check if new name already exists
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    // Handle permissions field - support both object and array formats
    if (updateRoleDto.permissions) {
      // Check if permissions is an array (string array format)
      if (Array.isArray(updateRoleDto.permissions)) {
        // Convert string array format to object format
        const permissionsObject: Record<string, string[]> = {};
        const validResources = ['tasks', 'projects', 'users', 'webhooks', 'roles', 'reports', 'api'];

        for (const permission of (updateRoleDto.permissions as any)) {
          // Permission format: resource.action (e.g., tasks.view, projects.create)
          const [resource, action] = (permission as string).split('.');

          if (!resource || !action) {
            throw new BadRequestException(`Invalid permission format: ${permission}. Expected format: resource.action`);
          }

          if (!validResources.includes(resource)) {
            throw new BadRequestException(`Invalid resource: ${resource}`);
          }

          if (!permissionsObject[resource]) {
            permissionsObject[resource] = [];
          }

          if (!permissionsObject[resource].includes(action)) {
            permissionsObject[resource].push(action);
          }
        }

        role.permissions = permissionsObject;
      } else {
        // Object format - use as is
        role.permissions = updateRoleDto.permissions as Record<string, string[]>;
      }
    }

    // Update other fields
    if (updateRoleDto.name !== undefined) {
      role.name = updateRoleDto.name;
    }
    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const role = await this.findOne(id);

    // Check if trying to delete system role
    if (role.isSystem) {
      throw new ForbiddenException('不能删除系统默认角色');
    }

    // Check if role is assigned to any users
    const userRolesCount = await this.userRoleRepository.count({
      where: { roleId: id },
    });

    if (userRolesCount > 0) {
      throw new ConflictException('Role is assigned to users, cannot delete');
    }

    await this.roleRepository.remove(role);
    
    return {
      success: true,
      message: '角色删除成功'
    };
  }

  async assignToUsers(roleId: string, assignRoleDto: AssignRoleDto): Promise<{ assignedCount: number }> {
    const role = await this.findOne(roleId);
    const { userIds } = assignRoleDto;

    let assignedCount = 0;

    for (const userId of userIds) {
      // Check if user already has this role
      const existingUserRole = await this.userRoleRepository.findOne({
        where: { userId, roleId },
      });

      if (!existingUserRole) {
        const userRole = this.userRoleRepository.create({
          userId,
          roleId,
        });
        await this.userRoleRepository.save(userRole);
        assignedCount++;
      }
    }

    return { assignedCount };
  }

  async removeFromUser(roleId: string, userId: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (!userRole) {
      throw new NotFoundException('User role not found');
    }

    await this.userRoleRepository.remove(userRole);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    // ADR-002 v2.1: 使用显式JOIN查询，移除relations选项
    const userRoles = await this.userRoleRepository
      .createQueryBuilder('userRole')
      .leftJoin('userRole.role', 'role')
      .select(['userRole.id', 'userRole.userId', 'userRole.roleId', 'role.id', 'role.name', 'role.description', 'role.permissions'])
      .where('userRole.userId = :userId', { userId })
      .getMany();

    return userRoles
      .filter(userRole => userRole.role)
      .map(userRole => userRole.role);
  }

  async getPermissions(): Promise<Record<string, string[]>> {
    // Define available permissions based on resources and operations
    return {
      tasks: ['view', 'create', 'edit', 'delete', 'manage'],
      projects: ['view', 'create', 'edit', 'delete', 'manage'],
      users: ['view', 'create', 'edit', 'delete', 'manage'],
      webhooks: ['view', 'create', 'edit', 'delete', 'manage'],
      roles: ['view', 'create', 'edit', 'delete', 'manage'],
      reports: ['view', 'create', 'export'],
      api: ['view', 'create', 'delete', 'manage'],
    };
  }

  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto): Promise<Role> {
    const role = await this.findOne(id);

    // Check if trying to update system role
    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system role permissions');
    }

    let permissionsObject: Record<string, string[]> = {};
    const validResources = ['tasks', 'projects', 'users', 'webhooks', 'roles', 'reports', 'api'];

    // Check if permissions is an object (object format) or array (string array format)
    if (!Array.isArray(assignPermissionsDto.permissions)) {
      // Object format - use as is
      permissionsObject = assignPermissionsDto.permissions as any;
    } else {
      // String array format - convert to object format
      for (const permission of assignPermissionsDto.permissions) {
        // Permission format: resource.action (e.g., tasks.view, projects.create)
        const [resource, action] = permission.split('.');

        if (!resource || !action) {
          throw new BadRequestException(`Invalid permission format: ${permission}. Expected format: resource.action`);
        }

        if (!validResources.includes(resource)) {
          throw new BadRequestException(`Invalid resource: ${resource}`);
        }

        if (!permissionsObject[resource]) {
          permissionsObject[resource] = [];
        }

        if (!permissionsObject[resource].includes(action)) {
          permissionsObject[resource].push(action);
        }
      }
    }

    role.permissions = permissionsObject;
    return this.roleRepository.save(role);
  }
}
