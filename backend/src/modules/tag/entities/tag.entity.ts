import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Task } from '../../task/entities/task.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 7, default: '#3B82F6' })
  color: string;

  @Column({ default: 0 })
  usage_count: number;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // tasks: Task[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
