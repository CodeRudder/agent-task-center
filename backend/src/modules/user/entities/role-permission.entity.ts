import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

/**
 * 角色权限关联实体 - 对应role_permissions表
 * 
 * 角色分类：
 * - admin：所有12个权限
 * - project_manager：8个权限（project + task相关）
 * - user：2个权限（task_view, task_edit）
 */
@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  role: string;

  @Column({ name: 'permission_id' })
  permissionId: number;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
