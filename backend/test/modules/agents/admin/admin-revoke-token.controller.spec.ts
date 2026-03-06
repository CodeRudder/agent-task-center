import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminRevokeTokenController } from '../../../../src/modules/agents/admin/admin-revoke-token.controller';
import { ApiTokenService } from '../../../../src/modules/agents/services/api-token.service';
import { AgentsService } from '../../../../src/modules/agents/agents.service';
import { Agent } from '../../../../src/modules/agents/entities/agent.entity';
import { AgentType, AgentStatus, AgentRole } from '../../../../src/modules/agents/entities/agent.entity';

describe('AdminRevokeTokenController', () => {
  let controller: AdminRevokeTokenController;
  let apiTokenService: ApiTokenService;
  let agentsService: AgentsService;

  const mockAgent: Agent = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Agent',
    type: AgentType.DEVELOPER,
    status: AgentStatus.ONLINE,
    maxConcurrentTasks: 5,
    apiToken: 'at_1234567890abcdef',
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
    revokeApiToken: jest.fn().mockResolvedValue(undefined),
  };

  const mockAgentsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRevokeTokenController],
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

    controller = module.get<AdminRevokeTokenController>(AdminRevokeTokenController);
    apiTokenService = module.get<ApiTokenService>(ApiTokenService);
    agentsService = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.revokeToken('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.data.agentId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.message).toBe('API token revoked successfully');
      expect(result.data.tokenRevokedAt).toBeDefined();
      expect(mockAgentsService.findOne).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(mockApiTokenService.revokeApiToken).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockAgentsService.findOne.mockResolvedValue(null);

      await expect(controller.revokeToken('550e8400-e29b-41d4-a716-446655440000'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct error structure', async () => {
      mockAgentsService.findOne.mockResolvedValue(null);

      try {
        await controller.revokeToken('550e8400-e29b-41d4-a716-446655440000');
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

      await expect(controller.revokeToken('550e8400-e29b-41d4-a716-446655440000'))
        .rejects.toThrow();
    });

    it('should return tokenRevokedAt timestamp', async () => {
      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.revokeToken('550e8400-e29b-41d4-a716-446655440000');

      expect(result.data.tokenRevokedAt).toBeDefined();
      expect(new Date(result.data.tokenRevokedAt)).toBeInstanceOf(Date);
    });
  });
});
