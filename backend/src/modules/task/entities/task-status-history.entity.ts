import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { User } from '../../user/entities/user.entity';

export enum ChangedByType {
  USER = 'user',
  AGENT = 'agent',
}

@Entity('task_status_histories')
@Index(['taskId', 'changedAt'])
export class TaskStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({
    name: 'old_status',
    type: 'enum',
    enum: TaskStatus,
    enumName: 'tasks_status_enum',
  })
  oldStatus: TaskStatus;

  @Column({
    name: 'new_status',
    type: 'enum',
    enum: TaskStatus,
    enumName: 'tasks_status_enum',
  })
  newStatus: TaskStatus;

  @Column({ name: 'changed_by' })
  changedBy: string;

  @Column({
    name: 'changed_by_type',
    type: 'enum',
    enum: ChangedByType,
    enumName: 'task_status_history_changed_by_type_enum',
  })
  changedByType: ChangedByType;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;

  // Relations
  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changer: User | null;
}
