import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AgentAuthGuard } from '../../../../src/modules/agents/guards/agent-auth.guard';
import { ApiTokenService } from '../../../../src/modules/agents/services/api-token.service';

describe('AgentAuthGuard', () => {
  let guard: AgentAuthGuard;
  let apiTokenService: ApiTokenService;

  const mockApiTokenService = {
    validateApiToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentAuthGuard,
        {
          provide: ApiTokenService,
          useValue: mockApiTokenService,
        },
      ],
    }).compile();

    guard = module.get<AgentAuthGuard>(AgentAuthGuard);
    apiTokenService = module.get<ApiTokenService>(ApiTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token', async () => {
      const mockPayload = {
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        agentName: 'Test Agent',
        role: 'worker_agent',
      };

      mockApiTokenService.validateApiToken.mockResolvedValue(mockPayload);

      const mockRequest: any = {
        headers: {
          authorization: 'Bearer at_validtoken',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockApiTokenService.validateApiToken).toHaveBeenCalledWith('at_validtoken');
    });

    it('should throw UnauthorizedException when Authorization header is missing', async () => {
      const mockRequest: any = {
        headers: {},
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Authorization header is invalid', async () => {
      const mockRequest: any = {
        headers: {
          authorization: 'InvalidToken',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockApiTokenService.validateApiToken.mockResolvedValue(null);

      const mockRequest: any = {
        headers: {
          authorization: 'Bearer at_invalidtoken',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should attach agent info to request for valid token', async () => {
      const mockPayload = {
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        agentName: 'Test Agent',
        role: 'worker_agent',
      };

      mockApiTokenService.validateApiToken.mockResolvedValue(mockPayload);

      const mockRequest: any = {
        headers: {
          authorization: 'Bearer at_validtoken',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.agent).toEqual(mockPayload);
    });
  });
});
