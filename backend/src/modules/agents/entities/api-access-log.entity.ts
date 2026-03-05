import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('api_access_logs')
@Index(['agentId', 'createdAt'])
@Index(['endpoint', 'createdAt'])
export class ApiAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id', length: '100' })
  agentId: string;

  @Column({ length: '255' })
  endpoint: string;

  @Column({ length: '10' })
  method: string;

  @Column({ name: 'status_code' })
  statusCode: number;

  @Column({ name: 'response_time_ms', nullable: true })
  responseTimeMs: number;

  @Column({ name: 'ip_address', length: '50', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', length: '255', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
