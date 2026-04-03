import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import {
  PermissionListResponseDto,
  RoleListResponseDto,
} from './dto/permission-response.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  /**
   * 获取所有权限
   */
  async getPermissions(): Promise<PermissionListResponseDto> {
    const permissions = await this.permissionRepository.find({
      order: { id: 'ASC' },
    });

    return {
      permissions: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        resourceType: p.resourceType,
        action: p.action,
        description: p.description,
      })),
    };
  }

  /**
   * 获取所有角色
   */
  async getRoles(): Promise<RoleListResponseDto> {
    const roles = [
      {
        name: 'admin',
        displayName: '系统管理员',
        description: '拥有所有权限',
      },
      {
        name: 'project_manager',
        displayName: '项目经理',
        description: '管理项目和任务',
      },
      {
        name: 'user',
        displayName: '普通用户',
        description: '查看和编辑自己创建的任务',
      },
    ];

    return { roles };
  }

  /**
   * 获取指定角色的权限
   */
  async getPermissionsByRole(role: string): Promise<Permission[]> {
    // ADR-002 v2.1: 使用显式JOIN查询，移除relations选项
    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoin('rp.permission', 'permission')
      .select(['rp.id', 'rp.role', 'rp.permissionId', 'permission.id', 'permission.name', 'permission.description', 'permission.resource'])
      .where('rp.role = :role', { role })
      .getMany();

    return rolePermissions
      .filter((rp) => rp.permission)
      .map((rp) => rp.permission);
  }
}
