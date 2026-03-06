import { AgentStatus, AgentType } from '../entities/agent.entity';

export class AgentLoadDto {
  currentTasks: number;
  maxConcurrentTasks: number;
  loadPercentage: number;
  status: AgentStatus;
}

export class AgentStatisticsDto {
  totalTasks: number;
  completedTasks: number;
  acceptedTasks: number;
  rejectedTasks: number;
  avgCompletionTime: number;
  successRate: number;
}

export class AgentResponseDto {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  maxConcurrentTasks: number;
  apiToken?: string;
  tokenCreatedAt?: Date;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  load?: AgentLoadDto;
  statistics?: AgentStatisticsDto;
}

export class AgentListResponseDto {
  items: AgentResponseDto[];
  total: number;
  page: number;
  limit: number;
}
