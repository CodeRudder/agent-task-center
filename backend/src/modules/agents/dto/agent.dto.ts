import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { AgentType, AgentStatus } from '../entities/agent.entity';

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsEnum(AgentType)
  type: AgentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxConcurrentTasks?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AgentType)
  type?: AgentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxConcurrentTasks?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class QueryAgentDto {
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsEnum(AgentType)
  type?: AgentType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  capabilities?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'load' | 'name' | 'success_rate';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class AgentLoadDto {
  currentTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  loadPercentage: number;
  isOverloaded: boolean;
}

export class AgentStatisticsDto {
  totalTasks: number;
  completedTasks: number;
  successRate: number;
  avgCompletionTime: number;
}

export class AgentResponseDto {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  maxConcurrentTasks: number;
  load: AgentLoadDto;
  statistics: AgentStatisticsDto;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
