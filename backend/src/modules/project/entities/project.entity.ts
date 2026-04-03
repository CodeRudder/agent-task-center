import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum ProjectMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('projects')
@Index(['ownerId'])
@Index(['createdAt'])
@Index(['updatedAt'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: '20',
    default: 'active',
  })
  status: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'owner_id' })
  ownerId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // owner: User;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // tasks: Task[];

  // 项目成员关系（通过ProjectMember中间表）
  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // members: ProjectMember[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;
}

// 项目成员关联表
@Entity('project_members')
@Index(['projectId'])
@Index(['userId'])
@Index(['projectId', 'userId'], { unique: true })
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // project: Project;

  @Column({ name: 'user_id' })
  userId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // user: User;

  @Column({
    type: 'enum',
    enum: ProjectMemberRole,
    enumName: 'project_member_role_enum',
    default: ProjectMemberRole.MEMBER,
  })
  role: ProjectMemberRole;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamp' })
  joinedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
