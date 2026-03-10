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
import { Subtask } from './subtask.entity';
import { TaskDependency } from './task-dependency.entity';
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

  @OneToMany(() => Subtask, (subtask) => subtask.task, { cascade: true })
  subtasks: Subtask[];

  @OneToMany(() => TaskDependency, (dep) => dep.task, { cascade: true })
  dependencies: TaskDependency[];

  @OneToMany(() => TaskStatusHistory, (history) => history.task)
  statusHistories: TaskStatusHistory[];

  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Task, (task) => task.subtasks)
  @JoinColumn({ name: 'parent_id' })
  parent: Task;

  @OneToMany(() => Task, (task) => task.parent)
  subtasksAsParent: Task[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'template_id', type: 'varchar', nullable: true })
  templateId: string | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'blocked_at', type: 'timestamp', nullable: true })
  blockedAt: Date | null;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
