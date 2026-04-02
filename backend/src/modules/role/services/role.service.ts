import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';

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

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    // Check if trying to delete system role
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    // Check if role is assigned to any users
    const userRolesCount = await this.userRoleRepository.count({
      where: { roleId: id },
    });

    if (userRolesCount > 0) {
      throw new ConflictException('Role is assigned to users, cannot delete');
    }

    await this.roleRepository.remove(role);
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
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.map(userRole => userRole.role);
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
}
