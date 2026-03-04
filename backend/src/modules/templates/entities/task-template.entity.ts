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
import { TaskPriority } from '../../task/entities/task.entity';

export enum TemplateCategory {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  GENERAL = 'general',
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
    default: TemplateCategory.GENERAL,
  })
  @Index()
  category: TemplateCategory;

  @Column({
    type: 'enum',
    enum: TaskPriority,
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

  @Column()
  @Index()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
