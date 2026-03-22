import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

/**
 * 权限实体 - 对应permissions表
 * 
 * 权限分类：
 * - task相关：task:create, task:read, task:update, task:delete
 * - user相关：user:create, user:read, user:update, user:delete
 * - permission相关：permission:manage
 * - notification相关：notification:push
 */
@Entity('permissions')
@Index('idx_permissions_name', ['name'])
@Index('idx_permissions_resource_action', ['resourceType', 'action'])
export class Permission {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'resource_type', nullable: true })
  resourceType: string;

  @Column({ nullable: true })
  action: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
