import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from '../../src/modules/agents/agents.controller';
import { AgentsService } from '../../src/modules/agents/agents.service';
import { AgentStatus, AgentType } from '../../src/modules/agents/entities/agent.entity';

describe('AgentsController', () => {
  let controller: AgentsController;

  const mockAgent = {
    id: 'test-uuid',
    name: 'Test Agent',
    type: AgentType.DEVELOPER,
    status: AgentStatus.ONLINE,
    maxConcurrentTasks: 5,
    apiToken: 'test-token',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockAgent),
    findAll: jest.fn().mockResolvedValue({ items: [mockAgent], total: 1 }),
    findOne: jest.fn().mockResolvedValue(mockAgent),
    update: jest.fn().mockResolvedValue(mockAgent),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
