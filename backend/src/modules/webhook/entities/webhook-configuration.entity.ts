import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('webhook_configurations')
@Index(['projectId'])
@Index(['isActive'])
export class WebhookConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 2048 })
  url: string;

  @Column({ length: 255 })
  secret: string;

  @Column({ type: 'jsonb', default: [] })
  events: string[];

  @Column({ type: 'jsonb', default: {} })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  template: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'retry_count', default: 3 })
  retryCount: number;

  @Column({ default: 5000 })
  timeout: number;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
