import { IsEnum, IsBoolean, IsOptional, IsDecimal, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyType } from '../entities/task-dependency.entity';

export class CreateTaskDependencyDto {
  @ApiProperty({ description: '任务ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: '依赖的任务ID' })
  @IsUUID()
  dependsOnTaskId: string;

  @ApiPropertyOptional({ description: '依赖类型' })
  @IsEnum(DependencyType)
  @IsOptional()
  dependencyType?: DependencyType;

  @ApiPropertyOptional({ description: '是否阻塞' })
  @IsBoolean()
  @IsOptional()
  isBlocking?: boolean;

  @ApiPropertyOptional({ description: '自动解决' })
  @IsBoolean()
  @IsOptional()
  autoResolve?: boolean;

  @ApiPropertyOptional({ description: '自动解决后时间（小时）' })
  @IsDecimal()
  @Min(0)
  @Max(168)
  @IsOptional()
  resolveAfterHours?: number;
}

export class UpdateTaskDependencyDto {
  @ApiPropertyOptional({ description: '依赖类型' })
  @IsEnum(DependencyType)
  @IsOptional()
  dependencyType?: DependencyType;

  @ApiPropertyOptional({ description: '是否阻塞' })
  @IsBoolean()
  @IsOptional()
  isBlocking?: boolean;

  @ApiPropertyOptional({ description: '自动解决' })
  @IsBoolean()
  @IsOptional()
  autoResolve?: boolean;

  @ApiPropertyOptional({ description: '自动解决后时间（小时）' })
  @IsDecimal()
  @Min(0)
  @Max(168)
  @IsOptional()
  resolveAfterHours?: number;
}

export class TaskDependencyResponseDto {
  @ApiProperty({ description: '依赖ID' })
  id: string;

  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '依赖的任务ID' })
  dependsOnTaskId: string;

  @ApiProperty({ description: '依赖类型' })
  dependencyType: DependencyType;

  @ApiProperty({ description: '是否阻塞' })
  isBlocking: boolean;

  @ApiProperty({ description: '自动解决' })
  autoResolve: boolean;

  @ApiProperty({ description: '自动解决后时间（小时）' })
  resolveAfterHours: number | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class TaskDependencyGraphDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '任务标题' })
  taskTitle: string;

  @ApiProperty({ description: '任务状态' })
  taskStatus: string;

  @ApiProperty({ description: '依赖关系列表' })
  dependencies: {
    dependsOnTaskId: string;
    dependsOnTaskTitle: string;
    dependsOnTaskStatus: string;
    dependencyType: DependencyType;
    isBlocking: boolean;
  }[];
}

export class CircularDependencyDto {
  @ApiProperty({ description: '循环路径' })
  path: string[];

  @ApiProperty({ description: '循环中的任务数量' })
  taskCount: number;

  @ApiProperty({ description: '建议的操作' })
  suggestion: string;
}
