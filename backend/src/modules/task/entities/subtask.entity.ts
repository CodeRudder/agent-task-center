import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from '../../task/entities/task.entity';

@Entity('subtasks')
@Index(['parentId', 'deletedAt'])
export class Subtask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ name: 'parent_id' })
  parentId: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({
    type: 'enum',
    enum: ['todo', 'in_progress', 'review', 'done', 'blocked'],
    default: 'todo',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: string;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: string | null;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Task, (task) => task.subtasks)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'parent_id' })
  parent: Task;
}
