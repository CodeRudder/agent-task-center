import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Permission } from './permission.entity';

/**
 * 角色权限关联实体 - 对应role_permissions表
 * 
 * 角色分类：
 * - admin：所有10个权限
 * - project_manager：5个权限（task:create, task:read, task:update, task:delete, user:read）
 * - user：3个权限（task:read, task:create, task:update）
 */
@Entity('role_permissions')
@Index('idx_role_permissions_role', ['role'])
@Index('idx_role_permissions_composite', ['role', 'permissionId'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  role: string;

  @Column({ name: 'permission_id' })
  permissionId: number;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
