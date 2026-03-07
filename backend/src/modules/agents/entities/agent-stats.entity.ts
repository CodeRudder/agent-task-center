import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Agent } from './agent.entity';

export enum PeriodType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  ALL_TIME = 'all_time',
}

@Entity('agent_stats')
@Index(['agentId', 'periodType', 'periodStart'], { unique: true })
export class AgentStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.statistics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ name: 'total_tasks', type: 'int', default: 0 })
  totalTasks: number;

  @Column({ name: 'completed_tasks', type: 'int', default: 0 })
  completedTasks: number;

  @Column({ name: 'accepted_tasks', type: 'int', default: 0 })
  acceptedTasks: number;

  @Column({ name: 'rejected_tasks', type: 'int', default: 0 })
  rejectedTasks: number;

  @Column({ 
    name: 'avg_completion_time_hours', 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    default: 0 
  })
  avgCompletionTimeHours: number;

  @Column({ 
    name: 'on_time_rate', 
    type: 'decimal', 
    precision: 5, 
    scale: 2, 
    default: 0 
  })
  onTimeRate: number;

  @Column({
    name: 'period_type',
    type: 'enum',
    enum: PeriodType,
  })
  periodType: PeriodType;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @Column({ name: 'calculated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
