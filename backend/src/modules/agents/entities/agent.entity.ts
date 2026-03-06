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

export enum AgentRole {
  ADMIN = 'admin',
  WORKER = 'worker',
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

  @Column({ length: 64, unique: true, name: 'api_token', nullable: true })
  @Index()
  apiToken: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'timestamp', name: 'token_created_at', nullable: true })
  tokenCreatedAt: Date;

  @Column({ type: 'timestamp', name: 'last_api_call_at', nullable: true })
  lastApiCallAt: Date;

  @Column({ type: 'timestamp', name: 'last_api_access_at', nullable: true })
  lastApiAccessAt: Date;

  @Column({
    type: 'enum',
    enum: AgentRole,
    default: AgentRole.WORKER,
    name: 'role',
  })
  role: AgentRole;

  @OneToMany(() => AgentStats, (stats) => stats.agent)
  statistics: AgentStats[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
