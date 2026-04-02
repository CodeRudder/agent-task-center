import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
@Index(['assigneeId'])
@Index(['creatorId'])
@Index(['status'])
@Index(['priority'])
@Index(['parentId'])
@Index(['dueDate'])
@Index(['deletedAt'])
@Index(['updatedAt']) // Phase 1: 增量查询机制需要
@Index(['assigneeId', 'updatedAt']) // Phase 1: 组合索引，优化增量查询
@Index(['projectId']) // V5.4: 项目管理需要
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'tasks_status_enum',
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    enumName: 'tasks_priority_enum',
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ name: 'progress', type: 'int', default: 0 })
  progress: number;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // assignee: User;

  @Column({ name: 'creator_id' })
  creatorId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // creator: User;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // comments: Comment[];

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // subtasks: Subtask[];

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // dependencies: TaskDependency[];

  // ADR-002: 移除关联查询，避免TypeORM生成错误表名
  // @OneToMany(() => TaskStatusHistory, (history) => history.task)
  // statusHistories: TaskStatusHistory[];

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // tags: Tag[];

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // categories: Category[];

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // parent: Task;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // subtasksAsParent: Task[];

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // project: Project;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'template_id', type: 'varchar', nullable: true })
  templateId: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'blocked_at', type: 'timestamp', nullable: true })
  blockedAt: Date;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
