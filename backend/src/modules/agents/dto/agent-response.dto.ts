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
  
  // V5: API Token相关字段
  apiToken?: string;
  apiTokenExpiresAt?: Date;
  lastApiAccessAt?: Date;
  // role?: AgentRole;
  
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
