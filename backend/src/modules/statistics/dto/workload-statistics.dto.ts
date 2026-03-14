import { ApiProperty } from '@nestjs/swagger';

export class UserWorkloadDto {
  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiProperty({ description: '用户名' })
  userName: string;

  @ApiProperty({ description: '分配的任务数' })
  assignedTasks: number;

  @ApiProperty({ description: '完成的任务数' })
  completedTasks: number;

  @ApiProperty({ description: '进行中的任务数' })
  inProgressTasks: number;

  @ApiProperty({ description: '完成率（百分比）' })
  completionRate: number;
}

export class WorkloadStatisticsResponseDto {
  @ApiProperty({ description: '用户工作量统计', type: [UserWorkloadDto] })
  users: UserWorkloadDto[];

  @ApiProperty({ description: '时间段内总任务数' })
  totalTasks: number;

  @ApiProperty({ description: '时间段内完成任务数' })
  totalCompleted: number;

  @ApiProperty({ description: '平均完成率' })
  averageCompletionRate: number;
}
