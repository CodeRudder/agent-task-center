import { IsEnum, IsBoolean, IsOptional, IsInt, IsUUID, Min, Max, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyType } from '../entities/task-dependency.entity';

export class CreateTaskDependencyDto {
  @ApiProperty({ description: '任务ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: '依赖的任务ID' })
  @IsUUID()
  dependsOnTaskId: string;

  @ApiPropertyOptional({ description: '依赖类型', enum: DependencyType })
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
  @IsInt()
  @Min(0)
  @Max(168)
  @IsOptional()
  resolveAfterHours?: number;
}

export class UpdateTaskDependencyDto {
  @ApiPropertyOptional({ description: '依赖类型', enum: DependencyType })
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
  @IsInt()
  @Min(0)
  @Max(168)
  @IsOptional()
  resolveAfterHours?: number;
}

export class TaskDependencyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty()
  dependsOnTaskId: string;

  @ApiProperty({ enum: DependencyType })
  dependencyType: DependencyType;

  @ApiProperty()
  isBlocking: boolean;

  @ApiProperty()
  autoResolve: boolean;

  @ApiPropertyOptional()
  resolveAfterHours?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CycleDetectionResponseDto {
  @ApiProperty({ description: '是否存在循环依赖' })
  hasCycle: boolean;

  @ApiPropertyOptional({ description: '循环路径' })
  cyclePath?: string[];

  @ApiPropertyOptional({ description: '检测的任务总数' })
  totalTasksChecked?: number;
}

export class SetDependenciesDto {
  @ApiProperty({ description: '依赖的任务ID数组', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  dependsOnTaskIds: string[];
}
