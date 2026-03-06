import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminRegenerateTokenController } from '../../../../src/modules/agents/admin/admin-regenerate-token.controller';
import { ApiTokenService } from '../../../../src/modules/agents/services/api-token.service';
import { AgentsService } from '../../../../src/modules/agents/agents.service';
import { Agent } from '../../../../src/modules/agents/entities/agent.entity';
import { AgentType, AgentStatus, AgentRole } from '../../../../src/modules/agents/entities/agent.entity';

describe('AdminRegenerateTokenController', () => {
  let controller: AdminRegenerateTokenController;
  let apiTokenService: ApiTokenService;
  let agentsService: AgentsService;

  const mockAgent: Agent = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Agent',
    type: AgentType.DEVELOPER,
    status: AgentStatus.ONLINE,
    maxConcurrentTasks: 5,
    apiToken: 'at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    apiTokenHash: null,
    apiTokenExpiresAt: null,
    tokenCreatedAt: new Date(),
    lastApiCallAt: null,
    lastApiAccessAt: null,
    role: AgentRole.WORKER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApiTokenService = {
    regenerateApiToken: jest.fn().mockResolvedValue('at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  };

  const mockAgentsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRegenerateTokenController],
      providers: [
        {
          provide: ApiTokenService,
          useValue: mockApiTokenService,
        },
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    controller = module.get<AdminRegenerateTokenController>(AdminRegenerateTokenController);
    apiTokenService = module.get<ApiTokenService>(ApiTokenService);
    agentsService = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('regenerateToken', () => {
    it('should regenerate token successfully', async () => {
      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.regenerateToken('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.data.apiToken).toBe('at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(result.data.agentId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.message).toBe('API token regenerated successfully');
      expect(mockAgentsService.findOne).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(mockApiTokenService.regenerateApiToken).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockAgentsService.findOne.mockResolvedValue(null);

      await expect(controller.regenerateToken('550e8400-e29b-41d4-a716-446655440000'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct error structure', async () => {
      mockAgentsService.findOne.mockResolvedValue(null);

      try {
        await controller.regenerateToken('550e8400-e29b-41d4-a716-446655440000');
      } catch (error) {
        expect(error.response).toEqual({
          success: false,
          message: 'Agent not found',
          error: 'NOT_FOUND',
          timestamp: expect.any(String),
        });
      }
    });

    it('should handle service errors', async () => {
      mockAgentsService.findOne.mockRejectedValue(new Error('Database error'));

      await expect(controller.regenerateToken('550e8400-e29b-41d4-a716-446655440000'))
        .rejects.toThrow();
    });

    it('should generate token format at_<random_string>', async () => {
      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.regenerateToken('550e8400-e29b-41d4-a716-446655440000');

      expect(result.data.apiToken).toMatch(/^at_[a-f0-9]{64}$/);
    });
  });
});
