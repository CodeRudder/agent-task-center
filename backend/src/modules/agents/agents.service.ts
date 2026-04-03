import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentStatus } from './entities/agent.entity';
import { AgentStats, PeriodType } from './entities/agent-stats.entity';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto, AgentLoadDto, AgentStatisticsDto } from './dto/agent.dto';
import { Task } from '../task/entities/task.entity';
import { TaskStatus } from '../task/entities/task.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(AgentStats)
    private agentStatsRepository: Repository<AgentStats>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createAgentDto: CreateAgentDto, userId: string): Promise<Agent> {
    // 生成不超过60个字符的apiToken（留4个字符给前缀"at_"）
    const randomBytes = Buffer.from(Math.random().toString()).toString('base64').substring(0, 56);
    const agent = this.agentRepository.create({
      ...createAgentDto,
      // createdBy removed - column does not exist in database
      apiToken: `at_${randomBytes}`,
    });

    return this.agentRepository.save(agent);
  }

  async findAll(query: QueryAgentDto): Promise<{ items: any[]; pagination: any }> {
    const {
      status,
      type,
      search,
      capabilities,
      sortBy = 'name',
      order = 'asc',
      page = 1,
      pageSize = 20,
    } = query;

    const queryBuilder = this.agentRepository
      .createQueryBuilder('agent')
      .where('agent.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('agent.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('agent.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(agent.name ILIKE :search OR agent.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (capabilities) {
      const capabilityArray = capabilities.split(',').map((c) => c.trim());
      capabilityArray.forEach((capability, index) => {
        queryBuilder.andWhere('agent.capabilities @> :capability', {
          capability: JSON.stringify([capability]),
        });
      });
    }

    // Sorting
    if (sortBy === 'name') {
      queryBuilder.orderBy('agent.name', order.toUpperCase() as 'ASC' | 'DESC');
    } else if (sortBy === 'load') {
      // Will be sorted after loading
      queryBuilder.orderBy('agent.name', 'ASC');
    } else if (sortBy === 'success_rate') {
      // Will be sorted after loading
      queryBuilder.orderBy('agent.name', 'ASC');
    }

    queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [agents, total] = await queryBuilder.getManyAndCount();

    // Enrich agents with load and statistics
    const enrichedAgents = await Promise.all(
      agents.map(async (agent) => {
        const load = await this.calculateAgentLoad(agent.id);
        const statistics = await this.getAgentStatistics(agent.id, PeriodType.ALL_TIME);
        const lastActiveAt = await this.getLastActiveAt(agent.id);

        // V5.2 P0 Fix: 计算tokenStatus
        let tokenStatus = 'none';
        if (agent.apiToken) {
          if (agent.apiTokenExpiresAt && new Date() > agent.apiTokenExpiresAt) {
            tokenStatus = 'revoked';
          } else {
            tokenStatus = 'generated';
          }
        }

        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          description: agent.description,
          capabilities: agent.capabilities || [],
          status: agent.status,
          tokenStatus, // V5.2 P0 Fix: 添加tokenStatus字段
          currentTasks: load.currentTasks, // V5.2 P0 Fix: 添加currentTasks字段
          maxTasks: agent.maxConcurrentTasks, // V5.2 P0 Fix: 映射为maxTasks
          maxConcurrentTasks: agent.maxConcurrentTasks, // 保留原字段以兼容
          tags: agent.capabilities || [], // V5.2 P0 Fix: 添加tags字段
          load,
          statistics,
          lastActiveAt,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        };
      })
    );

    // Sort by load or success_rate if needed
    if (sortBy === 'load') {
      enrichedAgents.sort((a, b) => {
        return order === 'asc'
          ? a.load.loadPercentage - b.load.loadPercentage
          : b.load.loadPercentage - a.load.loadPercentage;
      });
    } else if (sortBy === 'success_rate') {
      enrichedAgents.sort((a, b) => {
        return order === 'asc'
          ? a.statistics.successRate - b.statistics.successRate
          : b.statistics.successRate - a.statistics.successRate;
      });
    }

    return {
      items: enrichedAgents,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string): Promise<any> {
    const agent = await this.agentRepository.findOne({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const load = await this.calculateAgentLoad(agent.id);
    const statistics = await this.getAgentStatistics(agent.id, PeriodType.ALL_TIME);
    const currentTasks = await this.getCurrentTasks(agent.id);
    const recentHistory = await this.getRecentHistory(agent.id);
    const lastActiveAt = await this.getLastActiveAt(agent.id);

    // V5.2 P0 Fix: 计算tokenStatus
    let tokenStatus = 'none';
    if (agent.apiToken) {
      if (agent.apiTokenExpiresAt && new Date() > agent.apiTokenExpiresAt) {
        tokenStatus = 'revoked';
      } else {
        tokenStatus = 'generated';
      }
    }

    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      description: agent.description,
      capabilities: agent.capabilities || [],
      status: agent.status,
      tokenStatus, // V5.2 P0 Fix: 添加tokenStatus字段
      currentTasks: load.currentTasks, // V5.2 P0 Fix: 当前任务数量（数字）
      maxTasks: agent.maxConcurrentTasks, // V5.2 P0 Fix: 映射为maxTasks
      maxConcurrentTasks: agent.maxConcurrentTasks, // 保留原字段以兼容
      tags: agent.capabilities || [], // V5.2 P0 Fix: 添加tags字段
      load: {
        currentTasks: load.currentTasks,
        loadPercentage: load.loadPercentage,
      },
      currentTaskList: currentTasks, // V5.2 P0 Fix: 重命名为currentTaskList避免冲突
      statistics: {
        allTime: statistics,
        thisMonth: await this.getAgentStatistics(agent.id, PeriodType.MONTH),
      },
      recentHistory,
      createdAt: agent.createdAt,
      lastActiveAt,
    };
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { id } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    Object.assign(agent, updateAgentDto);

    return this.agentRepository.save(agent);
  }

  async updateStatus(id: string, status: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { id } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // 验证status值
    const validStatuses = Object.values(AgentStatus);
    if (!validStatuses.includes(status as AgentStatus)) {
      throw new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
    }

    agent.status = status as AgentStatus;

    return this.agentRepository.save(agent);
  }

  async remove(id: string): Promise<void> {
    const agent = await this.agentRepository.findOne({ where: { id } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // 使用软删除
    await this.agentRepository.softRemove(agent);
  }

  private async calculateAgentLoad(agentId: string): Promise<AgentLoadDto> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.assigneeId = :agentId', { agentId })
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.status NOT IN (:...completedStatuses)', {
        completedStatuses: [TaskStatus.DONE, TaskStatus.REVIEW],
      })
      .getMany();

    const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const currentTasks = tasks.length;

    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    const maxConcurrent = agent?.maxConcurrentTasks || 5;
    const loadPercentage = Math.round((currentTasks / maxConcurrent) * 100);

    return {
      currentTasks,
      inProgressTasks,
      pendingTasks,
      loadPercentage,
      isOverloaded: loadPercentage > 80,
    };
  }

  private async getAgentStatistics(agentId: string, period: PeriodType): Promise<AgentStatisticsDto> {
    const stats = await this.agentStatsRepository.findOne({
      where: {
        agentId,
        periodType: period,
      },
      order: {
        calculatedAt: 'DESC',
      },
    });

    if (!stats) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        successRate: 0,
        avgCompletionTime: 0,
      };
    }

    const successRate =
      stats.totalTasks > 0
        ? Math.round((stats.acceptedTasks / stats.totalTasks) * 100)
        : 0;

    return {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      successRate,
      avgCompletionTime: Number(stats.avgCompletionTimeHours),
    };
  }

  private async getCurrentTasks(agentId: string): Promise<any[]> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.assigneeId = :agentId', { agentId })
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.status IN (:...activeStatuses)', {
        activeStatuses: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      })
      .orderBy('task.priority', 'DESC')
      .addOrderBy('task.dueDate', 'ASC')
      .limit(10)
      .getMany();

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      progress: task.progress,
      priority: task.priority,
      dueDate: task.dueDate,
    }));
  }

  private async getRecentHistory(agentId: string): Promise<any[]> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.assigneeId = :agentId', { agentId })
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.status IN (:...completedStatuses)', {
        completedStatuses: [TaskStatus.DONE, TaskStatus.REVIEW],
      })
      .orderBy('task.updatedAt', 'DESC')
      .limit(5)
      .getMany();

    return tasks.map((task) => ({
      taskId: task.id,
      title: task.title,
      status: task.status,
      completedAt: task.updatedAt,
      duration: 0, // Would calculate from started_at to completed_at
    }));
  }

  private async getLastActiveAt(agentId: string): Promise<Date> {
    const lastTask = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.assigneeId = :agentId', { agentId })
      .andWhere('task.deletedAt IS NULL')
      .orderBy('task.updatedAt', 'DESC')
      .getOne();

    return lastTask?.updatedAt || new Date();
  }

  async validateToken(token: string): Promise<Agent | null> {
    const agent = await this.agentRepository.findOne({
      where: { apiToken: token },
    });

    if (!agent) {
      return null;
    }

    // 检查Token是否过期
    if (agent.apiTokenExpiresAt && new Date() > agent.apiTokenExpiresAt) {
      return null;
    }

    // 检查Agent状态
    if (agent.status !== AgentStatus.ONLINE) {
      return null;
    }

    return agent;
  }
}
