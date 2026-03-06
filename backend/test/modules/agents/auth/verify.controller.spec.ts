import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { VerifyController } from '../../../../src/modules/agents/auth/verify.controller';
import { ApiTokenService } from '../../../../src/modules/agents/services/api-token.service';
import { AgentsService } from '../../../../src/modules/agents/agents.service';
import { Agent } from '../../../../src/modules/agents/entities/agent.entity';
import { AgentType, AgentStatus, AgentRole } from '../../../../src/modules/agents/entities/agent.entity';

describe('VerifyController', () => {
  let controller: VerifyController;
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
    validateApiToken: jest.fn(),
  };

  const mockAgentsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifyController],
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

    controller = module.get<VerifyController>(VerifyController);
    apiTokenService = module.get<ApiTokenService>(ApiTokenService);
    agentsService = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verify', () => {
    it('should verify token successfully', async () => {
      const mockPayload = {
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        agentName: 'Test Agent',
        role: AgentRole.WORKER,
      };

      mockApiTokenService.validateApiToken.mockResolvedValue(mockPayload);
      mockAgentsService.findOne.mockResolvedValue(mockAgent);

      const result = await controller.verify('Bearer at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data.name).toBe('Test Agent');
      expect(result.data.status).toBe(AgentStatus.ONLINE);
      expect(result.data.role).toBe(AgentRole.WORKER);
      expect(result.data.type).toBe(AgentType.DEVELOPER);
      expect(result.message).toBe('Token verified successfully');
      expect(mockApiTokenService.validateApiToken).toHaveBeenCalledWith(
        'at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      );
      expect(mockAgentsService.findOne).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw UnauthorizedException when Authorization header is missing', async () => {
      await expect(controller.verify(undefined))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Authorization header is invalid', async () => {
      await expect(controller.verify('InvalidToken'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockApiTokenService.validateApiToken.mockResolvedValue(null);

      await expect(controller.verify('Bearer at_invalidtoken'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct error structure for missing header', async () => {
      try {
        await controller.verify(undefined);
      } catch (error) {
        expect(error.response).toEqual({
          success: false,
          message: 'Invalid or missing Authorization header',
          error: 'UNAUTHORIZED',
          timestamp: expect.any(String),
        });
      }
    });

    it('should throw UnauthorizedException with correct error structure for invalid token', async () => {
      mockApiTokenService.validateApiToken.mockResolvedValue(null);

      try {
        await controller.verify('Bearer at_invalidtoken');
      } catch (error) {
        expect(error.response).toEqual({
          success: false,
          message: 'Invalid or expired API token',
          error: 'UNAUTHORIZED',
          timestamp: expect.any(String),
        });
      }
    });
  });
});
