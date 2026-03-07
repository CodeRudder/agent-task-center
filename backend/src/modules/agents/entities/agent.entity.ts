import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AgentStats } from './agent-stats.entity';

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

export enum AgentType {
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  QA = 'qa',
  ARCHITECT = 'architect',
  PM = 'pm',
  DEVOPS = 'devops',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AgentType,
    default: AgentType.DEVELOPER,
  })
  type: AgentType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  capabilities: string[];

  @Column({
    type: 'enum',
    enum: AgentStatus,
    default: AgentStatus.OFFLINE,
  })
  status: AgentStatus;

  @Column({ name: 'max_concurrent_tasks', type: 'int', default: 5 })
  maxConcurrentTasks: number;

  @Column({ name: 'api_token', type: 'varchar', length: 255, unique: true, nullable: true })
  @Index()
  apiToken: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @OneToMany(() => AgentStats, (stats) => stats.agent)
  statistics: AgentStats[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
