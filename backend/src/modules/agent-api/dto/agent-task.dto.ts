import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../../task/entities/task.entity';
import { Type } from 'class-transformer';

export class CreateAgentTaskDto {
  @ApiProperty({ example: 'Implement user authentication' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Detailed description...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'agent-uuid' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: ['backend', 'auth'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { projectId: 'proj_123' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateProgressDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 60 })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ example: 'Completed backend implementation' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ example: 'Feature implemented and tested' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ type: 'array' })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

export class QueryAgentTasksDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
