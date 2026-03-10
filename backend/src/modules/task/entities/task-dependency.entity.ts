import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './task.entity';

export enum DependencyType {
  BLOCKING = 'blocking',
  RELATED = 'related',
  SEQUENTIAL = 'sequential',
}

@Entity('task_dependencies')
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.dependencies)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'depends_on_task_id' })
  dependsOnTaskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'depends_on_task_id' })
  dependsOnTask: Task;

  @Column({
    type: 'enum',
    enum: DependencyType,
    default: DependencyType.BLOCKING,
    name: 'dependency_type',
  })
  dependencyType: DependencyType;

  @Column({ type: 'boolean', default: true, name: 'is_blocking' })
  isBlocking: boolean;

  @Column({ type: 'boolean', default: false, name: 'auto_resolve' })
  autoResolve: boolean;

  @Column({ type: 'int', nullable: true, name: 'resolve_after_hours' })
  resolveAfterHours: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
