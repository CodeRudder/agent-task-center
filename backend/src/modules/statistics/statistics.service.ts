import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task } from '../task/entities/task.entity';
import { 
  TaskStatisticsQueryDto, 
  TaskStatisticsResponseDto,
  TaskStatusStatisticsDto,
  TaskPriorityStatisticsDto,
} from './dto/task-statistics.dto';
import { WorkloadStatisticsResponseDto, UserWorkloadDto } from './dto/workload-statistics.dto';
import { TrendAnalysisResponseDto, DailyTrendDto } from './dto/trend-analysis.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async getTaskStatistics(query: TaskStatisticsQueryDto): Promise<TaskStatisticsResponseDto> {
    const { startDate, endDate, userId, tagId, categoryId } = await this.parseQuery(query);
    
    const queryBuilder = this.taskRepository.createQueryBuilder('task');
    
    if (startDate && endDate) {
      queryBuilder.andWhere('task.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
    if (userId) {
      queryBuilder.andWhere('task.assigneeId = :userId', { userId });
    }

    const tasks = await queryBuilder.getMany();

    const statusStatistics = this.calculateStatusStatistics(tasks);
    const priorityStatistics = this.calculatePriorityStatistics(tasks);
    const tagStatistics = await this.calculateTagStatistics(tasks);
    const categoryStatistics = await this.calculateCategoryStatistics(tasks);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      statusStatistics,
      priorityStatistics,
      tagStatistics,
      categoryStatistics,
      totalTasks,
      completedTasks,
      completionRate,
    };
  }

  async getWorkloadStatistics(query: TaskStatisticsQueryDto): Promise<WorkloadStatisticsResponseDto> {
    const { startDate, endDate } = await this.parseQuery(query);
    
    // ADR-002 v2.1: 移除关联查询，只查询task表
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (startDate && endDate) {
      queryBuilder.andWhere('task.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const tasks = await queryBuilder.getMany();

    const userWorkloadMap = new Map<string, UserWorkloadDto>();

    tasks.forEach(task => {
      if (!task.assigneeId) return;

      const userId = task.assigneeId;
      if (!userWorkloadMap.has(userId)) {
        userWorkloadMap.set(userId, {
          userId,
          userName: `User-${userId}`, // ADR-002: 使用assigneeId，避免关联查询
          assignedTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          completionRate: 0,
        });
      }

      const userWorkload = userWorkloadMap.get(userId)!;
      userWorkload.assignedTasks++;
      if (task.status === 'done') userWorkload.completedTasks++;
      if (task.status === 'in_progress') userWorkload.inProgressTasks++;
    });

    const users = Array.from(userWorkloadMap.values()).map(user => {
      user.completionRate = user.assignedTasks > 0 
        ? (user.completedTasks / user.assignedTasks) * 100 
        : 0;
      return user;
    });

    const totalTasks = tasks.length;
    const totalCompleted = tasks.filter(t => t.status === 'done').length;
    const averageCompletionRate = users.length > 0
      ? users.reduce((sum, u) => sum + u.completionRate, 0) / users.length
      : 0;

    return { users, totalTasks, totalCompleted, averageCompletionRate };
  }

  async getTrendAnalysis(query: TaskStatisticsQueryDto): Promise<TrendAnalysisResponseDto> {
    const { startDate, endDate } = await this.parseQuery(query);
    
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (startDate && endDate) {
      queryBuilder.andWhere('task.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const tasks = await queryBuilder.getMany();

    const dailyTrendsMap = new Map<string, DailyTrendDto>();

    tasks.forEach(task => {
      const date = task.createdAt.toISOString().split('T')[0];
      if (!dailyTrendsMap.has(date)) {
        dailyTrendsMap.set(date, {
          date,
          createdTasks: 0,
          completedTasks: 0,
          blockedTasks: 0,
        });
      }

      const dailyTrend = dailyTrendsMap.get(date)!;
      dailyTrend.createdTasks++;
      if (task.status === 'done') dailyTrend.completedTasks++;
      if (task.status === 'blocked') dailyTrend.blockedTasks++;
    });

    const dailyTrends = Array.from(dailyTrendsMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    const totalCreated = tasks.length;
    const totalCompleted = tasks.filter(t => t.status === 'done').length;
    const days = dailyTrends.length || 1;
    const averageDailyCreated = totalCreated / days;
    const averageDailyCompleted = totalCompleted / days;

    return {
      dailyTrends,
      totalCreated,
      totalCompleted,
      averageDailyCreated,
      averageDailyCompleted,
    };
  }

  private async parseQuery(query: TaskStatisticsQueryDto) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.timeRange === 'custom' && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else if (query.timeRange) {
      const now = new Date();
      endDate = now;
      switch (query.timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
    }

    return { startDate, endDate, userId: query.userId, tagId: query.tagId, categoryId: query.categoryId };
  }

  private calculateStatusStatistics(tasks: Task[]): TaskStatusStatisticsDto {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
    };
  }

  private calculatePriorityStatistics(tasks: Task[]): TaskPriorityStatisticsDto {
    return {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
  }

  private async calculateTagStatistics(tasks: Task[]): Promise<{ tagName: string; count: number }[]> {
    // ADR-002: 移除关联查询，task.tags字段已注释
    // TODO: 使用显式JOIN查询或中间表查询
    const tagMap = new Map<string, number>();
    /*
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          const count = tagMap.get(tag.name) || 0;
          tagMap.set(tag.name, count + 1);
        });
      }
    });
    */
    return Array.from(tagMap.entries()).map(([tagName, count]) => ({ tagName, count }));
  }

  private async calculateCategoryStatistics(tasks: Task[]): Promise<{ categoryName: string; count: number }[]> {
    // ADR-002: 移除关联查询，task.categories字段已注释
    // TODO: 使用显式JOIN查询或中间表查询
    const categoryMap = new Map<string, number>();
    /*
    tasks.forEach(task => {
      if (task.categories) {
        task.categories.forEach(category => {
          const count = categoryMap.get(category.name) || 0;
          categoryMap.set(category.name, count + 1);
        });
      }
    });
    */
    return Array.from(categoryMap.entries()).map(([categoryName, count]) => ({ categoryName, count }));
  }
}
