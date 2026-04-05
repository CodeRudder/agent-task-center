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
    type: 'varchar',
    default: AgentType.DEVELOPER,
  })
  type: AgentType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('text', { 
    nullable: true, 
    array: true 
  })
  capabilities: string[];

  @Column({
    type: 'varchar',
    default: AgentStatus.OFFLINE,
  })
  status: AgentStatus;

  @Column({ name: 'max_concurrent_tasks', type: 'int', default: 5 })
  maxConcurrentTasks: number;

  // V5: API Token相关字段
  @Column({ type: 'varchar', length: 64, unique: true, name: 'api_token', nullable: true })
  @Index()
  apiToken!: string | null;

  // apiTokenHash removed - column does not exist in database

  @Column({ type: 'timestamp', name: 'api_token_expires_at', nullable: true })
  apiTokenExpiresAt: Date | null;

  // metadata removed - column does not exist in database
  // createdBy removed - column does not exist in database
  // tokenCreatedAt removed - column does not exist in database
  // lastApiCallAt removed - column does not exist in database
  // lastApiAccessAt removed - column does not exist in database

  // V5: Agent角色（用于权限控制）
  @Column({
    type: 'varchar',
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
