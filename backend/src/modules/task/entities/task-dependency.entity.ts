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
import { Task } from './task.entity';

export enum DependencyType {
  BLOCKING = 'blocking',
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  OPTIONAL = 'optional',
}

@Entity('task_dependencies')
@Index(['taskId', 'dependsOnTaskId'])
@Index(['dependsOnTaskId', 'dependencyType'])
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'depends_on_task_id' })
  dependsOnTaskId: string;

  @Column({
    type: 'enum',
    enum: DependencyType,
    default: DependencyType.BLOCKING,
  })
  dependencyType: DependencyType;

  @Column({ type: 'boolean', default: false })
  isBlocking: boolean;

  @Column({ type: 'boolean', default: false })
  autoResolve: boolean;

  @Column({ name: 'resolve_after_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  resolveAfterHours: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Task, (task) => task.dependencies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'depends_on_task_id' })
  dependsOnTask: Task;
}
