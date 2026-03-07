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
import { User } from '../../user/entities/user.entity';

export enum TemplateCategory {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  GENERAL = 'general',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    enumName: 'task_templates_category_enum',
    default: TemplateCategory.GENERAL,
  })
  @Index()
  category: TemplateCategory;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    enumName: 'task_templates_default_priority_enum',
    default: TaskPriority.MEDIUM,
  })
  defaultPriority: TaskPriority;

  @Column({ type: 'text', nullable: true })
  defaultTitle: string;

  @Column({ type: 'text', nullable: true })
  defaultDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultMetadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  estimatedMinutes: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  @Index()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
