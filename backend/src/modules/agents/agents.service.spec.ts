import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentsService } from './agents.service';
import { Agent, AgentStatus, AgentType } from './entities/agent.entity';
import { AgentStats, PeriodType } from './entities/agent-stats.entity';
import { Task, TaskStatus } from '../task/entities/task.entity';
import { NotFoundException } from '@nestjs/common';

describe('AgentsService', () => {
  let service: AgentsService;
  let agentRepository: Repository<Agent>;
  let agentStatsRepository: Repository<AgentStats>;
  let taskRepository: Repository<Task>;

  const mockAgentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAgentStatsRepository = {
    findOne: jest.fn(),
  };

  const mockTaskRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: getRepositoryToken(Agent),
          useValue: mockAgentRepository,
        },
        {
          provide: getRepositoryToken(AgentStats),
          useValue: mockAgentStatsRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    agentRepository = module.get<Repository<Agent>>(getRepositoryToken(Agent));
    agentStatsRepository = module.get<Repository<AgentStats>>(getRepositoryToken(AgentStats));
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new agent successfully', async () => {
      const createDto = {
        name: 'Test Agent',
        type: AgentType.DEVELOPER,
        description: 'Test Description',
        capabilities: ['test', 'jest'],
      };

      const userId = 'user-uuid';
      const mockAgent = {
        id: 'agent-uuid',
        ...createDto,
        createdBy: userId,
        apiToken: expect.any(String),
      };

      mockAgentRepository.create.mockReturnValue(mockAgent);
      mockAgentRepository.save.mockResolvedValue(mockAgent);

      const result = await service.create(createDto, userId);

      expect(mockAgentRepository.create).toHaveBeenCalled();
      expect(mockAgentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAgent);
    });
  });

  describe('findAll', () => {
    it('should return paginated agents with load and statistics', async () => {
      const query = {
        page: 1,
        pageSize: 20,
      };

      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          type: AgentType.DEVELOPER,
          status: AgentStatus.ONLINE,
          maxConcurrentTasks: 5,
          capabilities: ['frontend'],
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockAgents, 1]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockAgentStatsRepository.findOne.mockResolvedValue(null);

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockTaskQueryBuilder);

      const result = await service.findAll(query);

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.items[0]).toHaveProperty('load');
      expect(result.items[0]).toHaveProperty('statistics');
    });

    it('should filter agents by status', async () => {
      const query = {
        status: AgentStatus.ONLINE,
        page: 1,
        pageSize: 20,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'agent.status = :status',
        { status: AgentStatus.ONLINE }
      );
    });
  });

  describe('findOne', () => {
    it('should return agent details with current tasks and history', async () => {
      const agentId = 'agent-uuid';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        type: AgentType.DEVELOPER,
        status: AgentStatus.ONLINE,
        maxConcurrentTasks: 5,
        capabilities: ['test'],
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAgentRepository.findOne.mockResolvedValue(mockAgent);
      mockAgentStatsRepository.findOne.mockResolvedValue(null);

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockTaskQueryBuilder);

      const result = await service.findOne(agentId);

      expect(result.id).toBe(agentId);
      expect(result).toHaveProperty('load');
      expect(result).toHaveProperty('currentTasks');
      expect(result).toHaveProperty('statistics');
    });

    it('should throw NotFoundException when agent not found', async () => {
      const agentId = 'non-existent-uuid';
      mockAgentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(agentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update agent successfully', async () => {
      const agentId = 'agent-uuid';
      const updateDto = {
        name: 'Updated Agent',
        capabilities: ['updated', 'capabilities'],
      };

      const mockAgent = {
        id: agentId,
        name: 'Old Name',
        capabilities: ['old'],
      };

      mockAgentRepository.findOne.mockResolvedValue(mockAgent);
      mockAgentRepository.save.mockResolvedValue({ ...mockAgent, ...updateDto });

      const result = await service.update(agentId, updateDto);

      expect(mockAgentRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException when updating non-existent agent', async () => {
      const agentId = 'non-existent-uuid';
      mockAgentRepository.findOne.mockResolvedValue(null);

      await expect(service.update(agentId, {})).rejects.toThrow(NotFoundException);
    });

    it('should update agent status', async () => {
      const agentId = 'agent-uuid';
      const updateDto = {
        status: AgentStatus.BUSY,
      };

      const mockAgent = {
        id: agentId,
        status: AgentStatus.ONLINE,
      };

      mockAgentRepository.findOne.mockResolvedValue(mockAgent);
      mockAgentRepository.save.mockResolvedValue({ ...mockAgent, ...updateDto });

      const result = await service.update(agentId, updateDto);

      expect(result.status).toBe(AgentStatus.BUSY);
    });

    it('should update agent metadata', async () => {
      const agentId = 'agent-uuid';
      const updateDto = {
        metadata: { level: 'senior', experience_years: 5 },
      };

      const mockAgent = {
        id: agentId,
        metadata: {},
      };

      mockAgentRepository.findOne.mockResolvedValue(mockAgent);
      mockAgentRepository.save.mockResolvedValue({ ...mockAgent, ...updateDto });

      const result = await service.update(agentId, updateDto);

      expect(result.metadata).toEqual(updateDto.metadata);
    });
  });

  describe('edge cases', () => {
    it('should handle empty capabilities array', async () => {
      const query = { page: 1, pageSize: 20 };
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          type: AgentType.DEVELOPER,
          status: AgentStatus.ONLINE,
          maxConcurrentTasks: 5,
          capabilities: [],
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockAgents, 1]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockAgentStatsRepository.findOne.mockResolvedValue(null);

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockTaskQueryBuilder);

      const result = await service.findAll(query);

      expect(result.items[0].capabilities).toEqual([]);
    });

    it('should handle agent with maximum concurrent tasks', async () => {
      const agentId = 'agent-uuid';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        type: AgentType.DEVELOPER,
        status: AgentStatus.BUSY,
        maxConcurrentTasks: 20,
        capabilities: ['test'],
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAgentRepository.findOne.mockResolvedValue(mockAgent);
      mockAgentStatsRepository.findOne.mockResolvedValue(null);

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockTaskQueryBuilder);

      const result = await service.findOne(agentId);

      expect(result.id).toBe(agentId);
    });

    it('should sort agents by load percentage', async () => {
      const query = { sortBy: 'load' as const, order: 'desc' as const, page: 1, pageSize: 20 };
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          type: AgentType.DEVELOPER,
          status: AgentStatus.ONLINE,
          maxConcurrentTasks: 5,
          capabilities: ['test'],
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          type: AgentType.DEVELOPER,
          status: AgentStatus.ONLINE,
          maxConcurrentTasks: 5,
          capabilities: ['test'],
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockAgents, 2]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockAgentStatsRepository.findOne.mockResolvedValue(null);

      const mockTaskQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockTaskRepository.createQueryBuilder.mockReturnValue(mockTaskQueryBuilder);

      const result = await service.findAll(query);

      expect(result.items).toHaveLength(2);
    });

    it('should handle search query', async () => {
      const query = { search: 'test', page: 1, pageSize: 20 };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockAgentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(agent.name ILIKE :search OR agent.description ILIKE :search)',
        { search: '%test%' }
      );
    });
  });
});
