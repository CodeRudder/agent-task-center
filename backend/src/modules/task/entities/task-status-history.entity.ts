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

  @Column({ name: 'changed_by', type: 'text', nullable: true })
  changedBy: string | null;

  @Column({
    name: 'changed_by_type',
    type: 'enum',
    enum: ChangedByType,
    enumName: 'task_status_history_changed_by_type_enum',
  })
  changedByType: ChangedByType;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'changed_at' })
  changedAt: Date;

  @Column({ name: 'changer_name', type: 'text', nullable: true })
  changerName: string | null;

  @Column({ name: 'changer_id', type: 'text', nullable: true })
  changerId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Task, (task) => task.statusHistories)
  @JoinColumn({ name: 'task_id' })
  task: Task;
}
