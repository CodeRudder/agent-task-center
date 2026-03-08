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

  @Column()
  taskId: string;

  @ManyToOne(() => Task, (task) => task.dependencies)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  dependsOnTaskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'dependsOnTaskId' })
  dependsOnTask: Task;

  @Column({
    type: 'enum',
    enum: DependencyType,
    default: DependencyType.BLOCKING,
  })
  dependencyType: DependencyType;

  @Column({ type: 'boolean', default: true })
  isBlocking: boolean;

  @Column({ type: 'boolean', default: false })
  autoResolve: boolean;

  @Column({ type: 'int', nullable: true })
  resolveAfterHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
