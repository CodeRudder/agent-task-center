import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

/**
 * 权限实体 - 对应permissions表
 * 
 * 权限分类：
 * - project相关：project_view, project_edit, project_delete, project_manage
 * - task相关：task_view, task_edit, task_delete, task_manage
 * - user相关：user_view, user_edit, user_delete, user_manage
 */
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ length: 20 })
  action: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
