import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubtaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked',
}

export enum SubtaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateSubtaskDto {
  @ApiProperty({ description: '子任务标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '子任务描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '初始进度（0-100）' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ description: '优先级' })
  @IsEnum(SubtaskPriority)
  @IsOptional()
  priority?: SubtaskPriority;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '指派给的用户ID' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateSubtaskDto {
  @ApiPropertyOptional({ description: '子任务标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '子任务描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsEnum(SubtaskStatus)
  @IsOptional()
  status?: SubtaskStatus;

  @ApiPropertyOptional({ description: '优先级' })
  @IsEnum(SubtaskPriority)
  @IsOptional()
  priority?: SubtaskPriority;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '是否完成' })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}

export class UpdateProgressDto {
  @ApiProperty({ description: '进度（0-100）' })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ description: '完成时间' })
  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

export class SubtaskResponseDto {
  @ApiProperty({ description: '子任务ID' })
  id: string;

  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '父任务ID' })
  parentId: string;

  @ApiProperty({ description: '子任务标题' })
  title: string;

  @ApiProperty({ description: '子任务描述' })
  description: string | null;

  @ApiProperty({ description: '进度（0-100）' })
  progress: number;

  @ApiProperty({ description: '状态' })
  status: SubtaskStatus;

  @ApiProperty({ description: '优先级' })
  priority: SubtaskPriority;

  @ApiProperty({ description: '截止日期' })
  dueDate: Date | null;

  @ApiProperty({ description: '完成时间' })
  completedAt: Date | null;

  @ApiProperty({ description: '指派给的用户ID' })
  assignedToId: string | null;

  @ApiProperty({ description: '创建人ID' })
  createdBy: string;

  @ApiProperty({ description: '更新人ID' })
  updatedBy: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiProperty({ description: '删除时间' })
  deletedAt: Date | null;
}

export class TaskWithSubtasksResponseDto {
  @ApiProperty({ description: '任务ID' })
  id: string;

  @ApiProperty({ description: '任务标题' })
  title: string;

  @ApiProperty({ description: '任务描述' })
  description: string | null;

  @ApiProperty({ description: '任务进度' })
  progress: number;

  @ApiProperty({ description: '任务状态' })
  status: string;

  @ApiProperty({ description: '子任务数量' })
  subtaskCount: number;

  @ApiProperty({ description: '已完成的子任务数量' })
  completedSubtaskCount: number;

  @ApiProperty({ description: '子任务列表' })
  subtasks: SubtaskResponseDto[];
}
