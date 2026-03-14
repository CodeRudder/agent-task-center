import { ApiProperty } from '@nestjs/swagger';

export class DailyTrendDto {
  @ApiProperty({ description: '日期（YYYY-MM-DD）' })
  date: string;

  @ApiProperty({ description: '创建的任务数' })
  createdTasks: number;

  @ApiProperty({ description: '完成的任务数' })
  completedTasks: number;

  @ApiProperty({ description: '阻塞的任务数' })
  blockedTasks: number;
}

export class TrendAnalysisResponseDto {
  @ApiProperty({ description: '每日趋势数据', type: [DailyTrendDto] })
  dailyTrends: DailyTrendDto[];

  @ApiProperty({ description: '时间段内总创建任务数' })
  totalCreated: number;

  @ApiProperty({ description: '时间段内总完成任务数' })
  totalCompleted: number;

  @ApiProperty({ description: '平均每日创建任务数' })
  averageDailyCreated: number;

  @ApiProperty({ description: '平均每日完成任务数' })
  averageDailyCompleted: number;
}
