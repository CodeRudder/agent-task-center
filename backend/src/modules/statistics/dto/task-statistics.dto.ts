import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';

export enum StatisticsTimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class TaskStatisticsQueryDto {
  @ApiProperty({ 
    description: '统计时间范围', 
    enum: StatisticsTimeRange,
    example: StatisticsTimeRange.WEEK,
    required: false 
  })
  @IsOptional()
  @IsEnum(StatisticsTimeRange)
  timeRange?: StatisticsTimeRange;

  @ApiProperty({ 
    description: '开始日期（ISO格式）', 
    example: '2024-01-01T00:00:00Z',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    description: '结束日期（ISO格式）', 
    example: '2024-12-31T23:59:59Z',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    description: '用户ID（筛选特定用户）', 
    required: false 
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ 
    description: '标签ID（筛选特定标签）', 
    required: false 
  })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiProperty({ 
    description: '分类ID（筛选特定分类）', 
    required: false 
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class TaskStatusStatisticsDto {
  @ApiProperty({ description: '待办任务数' })
  todo: number;

  @ApiProperty({ description: '进行中任务数' })
  inProgress: number;

  @ApiProperty({ description: '审核中任务数' })
  review: number;

  @ApiProperty({ description: '已完成任务数' })
  done: number;

  @ApiProperty({ description: '阻塞任务数' })
  blocked: number;
}

export class TaskPriorityStatisticsDto {
  @ApiProperty({ description: '高优先级任务数' })
  high: number;

  @ApiProperty({ description: '中优先级任务数' })
  medium: number;

  @ApiProperty({ description: '低优先级任务数' })
  low: number;
}

export class TaskStatisticsResponseDto {
  @ApiProperty({ description: '任务状态统计' })
  statusStatistics: TaskStatusStatisticsDto;

  @ApiProperty({ description: '任务优先级统计' })
  priorityStatistics: TaskPriorityStatisticsDto;

  @ApiProperty({ description: '标签使用统计' })
  tagStatistics: { tagName: string; count: number }[];

  @ApiProperty({ description: '分类使用统计' })
  categoryStatistics: { categoryName: string; count: number }[];

  @ApiProperty({ description: '总任务数' })
  totalTasks: number;

  @ApiProperty({ description: '已完成任务数' })
  completedTasks: number;

  @ApiProperty({ description: '完成率（百分比）' })
  completionRate: number;
}
