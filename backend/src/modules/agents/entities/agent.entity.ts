import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AgentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
}

export enum AgentType {
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  QA = 'QA',
  ARCHITECT = 'ARCHITECT',
  PM = 'PM',
  DEVOPS = 'DEVOPS',
}

export enum AgentRole {
  ADMIN = 'admin_agent',
  WORKER = 'worker_agent',
  READONLY = 'readonly_agent',
}

@Entity('agents')
@Index(['status'])
@Index(['type'])
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: AgentType,
  })
  type: AgentType;

  @Column({
    type: 'enum',
    enum: AgentStatus,
    default: AgentStatus.OFFLINE,
  })
  status: AgentStatus;

  @Column({ default: 5, name: 'max_concurrent_tasks' })
  maxConcurrentTasks: number;

  // V5: API Token相关字段
  @Column({ length: 255, unique: true, name: 'api_token', nullable: true })
  @Index()
  apiToken: string;

  @Column({ length: 255, unique: true, name: 'api_token_hash', nullable: true })
  apiTokenHash: string;

  @Column({ type: 'timestamp', name: 'api_token_expires_at', nullable: true })
  apiTokenExpiresAt: Date;

  @Column({ type: 'timestamp', name: 'last_api_access_at', nullable: true })
  lastApiAccessAt: Date;

  // V5: Agent角色（用于权限控制）
  @Column({
    type: 'enum',
    enum: AgentRole,
    default: AgentRole.WORKER,
    name: 'role',
  })
  role: AgentRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
