import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTokenService } from '../../../../src/modules/agents/services/api-token.service';
import { Agent } from '../../../../src/modules/agents/entities/agent.entity';
import { AgentType, AgentStatus, AgentRole } from '../../../../src/modules/agents/entities/agent.entity';

describe('ApiTokenService', () => {
  let service: ApiTokenService;
  let repository: Repository<Agent>;

  const mockAgent: Agent = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Agent',
    type: AgentType.DEVELOPER,
    status: AgentStatus.ONLINE,
    maxConcurrentTasks: 5,
    apiToken: null,
    apiTokenHash: null,
    apiTokenExpiresAt: null,
    tokenCreatedAt: null,
    lastApiCallAt: null,
    lastApiAccessAt: null,
    role: AgentRole.WORKER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiTokenService,
        {
          provide: getRepositoryToken(Agent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApiTokenService>(ApiTokenService);
    repository = module.get<Repository<Agent>>(getRepositoryToken(Agent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateApiToken', () => {
    it('should generate API token successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockAgent);
      mockRepository.save.mockResolvedValue({ ...mockAgent });

      const token = await service.generateApiToken('550e8400-e29b-41d4-a716-446655440000');

      expect(token).toMatch(/^at_[a-f0-9]{64}$/);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when agent not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.generateApiToken('550e8400-e29b-41d4-a716-446655440000'))
        .rejects.toThrow('Agent not found');
    });

    it('should set tokenCreatedAt field', async () => {
      mockRepository.findOne.mockResolvedValue(mockAgent);
      mockRepository.save.mockImplementation((agent) => Promise.resolve(agent));

      await service.generateApiToken('550e8400-e29b-41d4-a716-446655440000');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          apiToken: expect.any(String),
          tokenCreatedAt: expect.any(Date),
          apiTokenHash: null,
          apiTokenExpiresAt: null,
        })
      );
    });
  });

  describe('validateApiToken', () => {
    it('should validate valid token successfully', async () => {
      const agentWithToken = {
        ...mockAgent,
        apiToken: 'at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      mockRepository.findOne.mockResolvedValue(agentWithToken);
      mockRepository.save.mockResolvedValue(agentWithToken);

      const payload = await service.validateApiToken('at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

      expect(payload).toEqual({
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        agentName: 'Test Agent',
        role: AgentRole.WORKER,
      });
    });

    it('should return null for invalid token format', async () => {
      const payload = await service.validateApiToken('invalid_token');

      expect(payload).toBeNull();
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null when token not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const payload = await service.validateApiToken('at_notfoundtoken1234567890abcdef1234567890abcdef1234567890');

      expect(payload).toBeNull();
    });

    it('should update lastApiCallAt and lastApiAccessAt when validating', async () => {
      const agentWithToken = {
        ...mockAgent,
        apiToken: 'at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      mockRepository.findOne.mockResolvedValue(agentWithToken);
      mockRepository.save.mockImplementation((agent) => Promise.resolve(agent));

      await service.validateApiToken('at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastApiCallAt: expect.any(Date),
          lastApiAccessAt: expect.any(Date),
        })
      );
    });

    it('should return null for token starting with invalid prefix', async () => {
      const payload = await service.validateApiToken('invalid_1234567890abcdef');

      expect(payload).toBeNull();
    });
  });

  describe('revokeApiToken', () => {
    it('should revoke API token successfully', async () => {
      const agentWithToken = {
        ...mockAgent,
        apiToken: 'at_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      mockRepository.findOne.mockResolvedValue(agentWithToken);
      mockRepository.save.mockResolvedValue({ ...agentWithToken, apiToken: null });

      await service.revokeApiToken('550e8400-e29b-41d4-a716-446655440000');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          apiToken: null,
          apiTokenHash: null,
          apiTokenExpiresAt: null,
          tokenCreatedAt: null,
          lastApiCallAt: null,
        })
      );
    });

    it('should throw error when agent not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.revokeApiToken('550e8400-e29b-41d4-a716-446655440000'))
        .rejects.toThrow('Agent not found');
    });
  });

  describe('regenerateApiToken', () => {
    it('should regenerate API token successfully', async () => {
      const agentWithToken = {
        ...mockAgent,
        apiToken: 'at_oldtoken1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(agentWithToken)
        .mockResolvedValueOnce(agentWithToken);
      mockRepository.save.mockResolvedValue(agentWithToken);

      const newToken = await service.regenerateApiToken('550e8400-e29b-41d4-a716-446655440000');

      expect(newToken).toMatch(/^at_[a-f0-9]{64}$/);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
