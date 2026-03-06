import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentStatus } from './entities/agent.entity';
import {
  CreateAgentDto,
  UpdateAgentDto,
  QueryAgentDto,
  AgentResponseDto,
  AgentListResponseDto,
  AgentLoadDto,
  AgentStatisticsDto,
} from './dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  async create(createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      apiToken: `agent_${uuidv4()}`,
      status: AgentStatus.OFFLINE,
    });

    const saved = await this.agentRepository.save(agent);
    return this.toResponseDto(saved, true); // 创建时返回token
  }

  async findAll(query: QueryAgentDto): Promise<AgentListResponseDto> {
    const { page = 1, limit = 10, status, type, search } = query;

    const qb = this.agentRepository.createQueryBuilder('agent');

    if (status) {
      qb.andWhere('agent.status = :status', { status });
    }

    if (type) {
      qb.andWhere('agent.type = :type', { type });
    }

    if (search) {
      qb.andWhere(
        '(agent.name ILIKE :search OR agent.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('agent.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((agent) => this.toResponseDto(agent)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<AgentResponseDto> {
    const agent = await this.agentRepository.findOne({ where: { id } });

    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }

    const response = this.toResponseDto(agent);
    
    response.load = await this.calculateAgentLoad(id);
    response.statistics = await this.getAgentStatistics(id);

    return response;
  }

  async update(
    id: string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    const agent = await this.agentRepository.findOne({ where: { id } });

    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }

    Object.assign(agent, updateAgentDto);
    const saved = await this.agentRepository.save(agent);

    return this.toResponseDto(saved);
  }

  private toResponseDto(agent: Agent, includeToken = false): AgentResponseDto {
    const response: AgentResponseDto = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      maxConcurrentTasks: agent.maxConcurrentTasks,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };

    // 仅在创建时返回token，之后不再返回
    if (includeToken && agent.apiToken) {
      response.apiToken = agent.apiToken;
      response.tokenCreatedAt = agent.tokenCreatedAt;
      response.tokenExpiresAt = agent.tokenExpiresAt;
    }

    return response;
  }

  private async calculateAgentLoad(agentId: string): Promise<AgentLoadDto> {
    return {
      currentTasks: 0,
      maxConcurrentTasks: 5,
      loadPercentage: 0,
      status: AgentStatus.OFFLINE,
    };
  }

  private async getAgentStatistics(
    agentId: string,
  ): Promise<AgentStatisticsDto> {
    return {
      totalTasks: 0,
      completedTasks: 0,
      acceptedTasks: 0,
      rejectedTasks: 0,
      avgCompletionTime: 0,
      successRate: 0,
    };
  }
}
