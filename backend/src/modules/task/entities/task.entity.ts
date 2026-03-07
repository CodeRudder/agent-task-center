import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { TaskStatusHistory } from './task-status-history.entity';

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
  dueDate: Date | null;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => TaskStatusHistory, (history) => history.task)
  statusHistories: TaskStatusHistory[];

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @VersionColumn({ name: 'version' })
  version: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'blocked_at', type: 'timestamp', nullable: true })
  blockedAt: Date | null;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason: string | null;

  @Column({ name: 'last_api_call_at', type: 'timestamp', nullable: true })
  lastApiCallAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;
}
