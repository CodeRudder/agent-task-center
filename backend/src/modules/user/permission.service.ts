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
    // 临时返回硬编码的权限列表（permissions表不存在）
    const permissions = [
      // 任务相关权限
      { id: 1, name: 'task_view', resourceType: 'task', action: 'view', description: '查看任务' },
      { id: 2, name: 'task_create', resourceType: 'task', action: 'create', description: '创建任务' },
      { id: 3, name: 'task_edit', resourceType: 'task', action: 'edit', description: '编辑任务' },
      { id: 4, name: 'task_delete', resourceType: 'task', action: 'delete', description: '删除任务' },
      { id: 5, name: 'task_manage', resourceType: 'task', action: 'manage', description: '管理任务' },
      
      // 项目相关权限
      { id: 6, name: 'project_view', resourceType: 'project', action: 'view', description: '查看项目' },
      { id: 7, name: 'project_create', resourceType: 'project', action: 'create', description: '创建项目' },
      { id: 8, name: 'project_edit', resourceType: 'project', action: 'edit', description: '编辑项目' },
      { id: 9, name: 'project_delete', resourceType: 'project', action: 'delete', description: '删除项目' },
      { id: 10, name: 'project_manage', resourceType: 'project', action: 'manage', description: '管理项目' },
      
      // 用户相关权限
      { id: 11, name: 'user_view', resourceType: 'user', action: 'view', description: '查看用户' },
      { id: 12, name: 'user_create', resourceType: 'user', action: 'create', description: '创建用户' },
      { id: 13, name: 'user_edit', resourceType: 'user', action: 'edit', description: '编辑用户' },
      { id: 14, name: 'user_delete', resourceType: 'user', action: 'delete', description: '删除用户' },
      { id: 15, name: 'user_manage', resourceType: 'user', action: 'manage', description: '管理用户' },
      
      // Webhook相关权限
      { id: 16, name: 'webhook_view', resourceType: 'webhook', action: 'view', description: '查看Webhook' },
      { id: 17, name: 'webhook_create', resourceType: 'webhook', action: 'create', description: '创建Webhook' },
      { id: 18, name: 'webhook_edit', resourceType: 'webhook', action: 'edit', description: '编辑Webhook' },
      { id: 19, name: 'webhook_delete', resourceType: 'webhook', action: 'delete', description: '删除Webhook' },
      { id: 20, name: 'webhook_manage', resourceType: 'webhook', action: 'manage', description: '管理Webhook' },
      
      // 角色相关权限
      { id: 21, name: 'role_view', resourceType: 'role', action: 'view', description: '查看角色' },
      { id: 22, name: 'role_create', resourceType: 'role', action: 'create', description: '创建角色' },
      { id: 23, name: 'role_edit', resourceType: 'role', action: 'edit', description: '编辑角色' },
      { id: 24, name: 'role_delete', resourceType: 'role', action: 'delete', description: '删除角色' },
      { id: 25, name: 'role_manage', resourceType: 'role', action: 'manage', description: '管理角色' },
      
      // 报表相关权限
      { id: 26, name: 'report_view', resourceType: 'report', action: 'view', description: '查看报表' },
      { id: 27, name: 'report_create', resourceType: 'report', action: 'create', description: '创建报表' },
      { id: 28, name: 'report_export', resourceType: 'report', action: 'export', description: '导出报表' },
      
      // API相关权限
      { id: 29, name: 'api_view', resourceType: 'api', action: 'view', description: '查看API' },
      { id: 30, name: 'api_create', resourceType: 'api', action: 'create', description: '创建API密钥' },
      { id: 31, name: 'api_delete', resourceType: 'api', action: 'delete', description: '删除API密钥' },
      { id: 32, name: 'api_manage', resourceType: 'api', action: 'manage', description: '管理API密钥' },
    ];

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
