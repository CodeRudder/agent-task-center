import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { StatisticsService } from './statistics.service';
import { TaskStatisticsQueryDto, TaskStatisticsResponseDto } from './dto/task-statistics.dto';
import { WorkloadStatisticsResponseDto } from './dto/workload-statistics.dto';
import { TrendAnalysisResponseDto } from './dto/trend-analysis.dto';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('tasks')
  @ApiOperation({ summary: '获取任务统计数据' })
  @ApiResponse({ status: 200, description: '返回任务统计数据', type: TaskStatisticsResponseDto })
  getTaskStatistics(@Query() query: TaskStatisticsQueryDto): Promise<TaskStatisticsResponseDto> {
    return this.statisticsService.getTaskStatistics(query);
  }

  @Get('workload')
  @ApiOperation({ summary: '获取工作量统计数据' })
  @ApiResponse({ status: 200, description: '返回工作量统计数据', type: WorkloadStatisticsResponseDto })
  getWorkloadStatistics(@Query() query: TaskStatisticsQueryDto): Promise<WorkloadStatisticsResponseDto> {
    return this.statisticsService.getWorkloadStatistics(query);
  }

  @Get('trends')
  @ApiOperation({ summary: '获取趋势分析数据' })
  @ApiResponse({ status: 200, description: '返回趋势分析数据', type: TrendAnalysisResponseDto })
  getTrendAnalysis(@Query() query: TaskStatisticsQueryDto): Promise<TrendAnalysisResponseDto> {
    return this.statisticsService.getTrendAnalysis(query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: '导出统计数据为CSV' })
  async exportCsv(@Query() query: TaskStatisticsQueryDto, @Res() res: Response): Promise<void> {
    const statistics = await this.statisticsService.getTaskStatistics(query);
    
    const csvData = this.convertToCSV(statistics);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=task-statistics.csv');
    res.send(csvData);
  }

  private convertToCSV(data: TaskStatisticsResponseDto): string {
    const rows = [
      ['指标', '数值'],
      ['总任务数', data.totalTasks],
      ['已完成任务数', data.completedTasks],
      ['完成率(%)', data.completionRate.toFixed(2)],
      ['待办任务数', data.statusStatistics.todo],
      ['进行中任务数', data.statusStatistics.inProgress],
      ['审核中任务数', data.statusStatistics.review],
      ['已完成任务数', data.statusStatistics.done],
      ['阻塞任务数', data.statusStatistics.blocked],
      ['高优先级任务数', data.priorityStatistics.high],
      ['中优先级任务数', data.priorityStatistics.medium],
      ['低优先级任务数', data.priorityStatistics.low],
    ];

    return rows.map(row => row.join(',')).join('\n');
  }
}
