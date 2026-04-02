import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WebhookConfiguration } from './webhook-configuration.entity';

@Entity('webhook_logs')
@Index(['webhook_id'])
@Index(['status'])
@Index(['executed_at'])
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'webhook_id' })
  webhook_id: string;

  @Column({ length: 100 })
  event_type: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  response_code: number;

  @Column({ type: 'text', nullable: true })
  response_body: string;

  @Column({ length: 50 })
  status: string;

  @Column({ default: 1 })
  attempt: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @ManyToOne(() => WebhookConfiguration)
  @JoinColumn({ name: 'webhook_id' })
  webhook: WebhookConfiguration;

  @CreateDateColumn({ name: 'executed_at' })
  executed_at: Date;
}