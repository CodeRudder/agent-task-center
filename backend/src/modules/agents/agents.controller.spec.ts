import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentType, AgentStatus } from './entities/agent.entity';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;

  const mockAgentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated agents', async () => {
      const query = { page: 1, pageSize: 20 };
      const mockResult = {
        items: [
          {
            id: 'agent-1',
            name: 'Agent 1',
            type: AgentType.DEVELOPER,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockAgentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockAgentsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return agent details', async () => {
      const agentId = 'agent-uuid';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        type: AgentType.DEVELOPER,
        load: {},
        statistics: {},
        currentTasks: [],
      };

      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.findOne(agentId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAgent);
      expect(mockAgentsService.findOne).toHaveBeenCalledWith(agentId);
    });
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const createDto = {
        name: 'New Agent',
        type: AgentType.DEVELOPER,
        capabilities: ['test'],
      };

      const mockRequest = {
        user: { userId: 'user-uuid' },
      };

      const mockAgent = {
        id: 'agent-uuid',
        ...createDto,
      };

      mockAgentsService.create.mockResolvedValue(mockAgent);

      const result = await controller.create(createDto, mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAgent);
      expect(result.message).toBe('Agent created successfully');
      expect(mockAgentsService.create).toHaveBeenCalledWith(createDto, 'user-uuid');
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const agentId = 'agent-uuid';
      const updateDto = {
        name: 'Updated Agent',
        capabilities: ['updated'],
      };

      const mockAgent = {
        id: agentId,
        ...updateDto,
      };

      mockAgentsService.update.mockResolvedValue(mockAgent);

      const result = await controller.update(agentId, updateDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAgent);
      expect(result.message).toBe('Agent updated successfully');
      expect(mockAgentsService.update).toHaveBeenCalledWith(agentId, updateDto);
    });
  });
});
