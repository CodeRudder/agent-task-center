import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';

export enum PeriodType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  ALL_TIME = 'ALL_TIME',
}

@Entity('agent_stats')
export class AgentStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column({
    type: 'enum',
    enum: PeriodType,
  })
  periodType: PeriodType;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ default: 0 })
  totalTasks: number;

  @Column({ default: 0 })
  completedTasks: number;

  @Column({ default: 0 })
  acceptedTasks: number;

  @Column({ default: 0 })
  rejectedTasks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  avgCompletionTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @CreateDateColumn()
  createdAt: Date;
}
