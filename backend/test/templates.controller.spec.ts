import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from '../src/modules/templates/templates.controller';
import { TemplatesService } from '../src/modules/templates/templates.service';
import { TaskTemplate, TemplateCategory } from '../src/modules/templates/entities/task-template.entity';
import { Task, TaskStatus, TaskPriority } from '../src/modules/task/entities/task.entity';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: TemplatesService;

  const mockTemplateId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';

  const mockTemplate: TaskTemplate = {
    id: mockTemplateId,
    name: 'Bug Fix Template',
    description: 'Template for bug fix tasks',
    category: TemplateCategory.DEVELOPMENT,
    defaultPriority: TaskPriority.HIGH,
    defaultTitle: 'Bug: {{description}}',
    defaultDescription: 'Steps to reproduce',
    defaultMetadata: null,
    tags: ['bug', 'urgent'],
    estimatedMinutes: 60,
    usageCount: 0,
    isActive: true,
    createdById: mockUserId,
    createdBy: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockRequest = {
    user: { id: mockUserId },
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    applyTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
    service = module.get<TemplatesService>(TemplatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const createDto = {
        name: 'New Template',
        category: TemplateCategory.DEVELOPMENT,
      };

      mockService.create.mockResolvedValue(mockTemplate);

      const result = await controller.create(createDto, mockRequest);

      expect(mockService.create).toHaveBeenCalledWith(createDto, mockUserId);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const queryDto = { page: 1, pageSize: 10 };
      const mockResult = { items: [mockTemplate], total: 1 };

      mockService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(mockService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      mockService.findOne.mockResolvedValue(mockTemplate);

      const result = await controller.findOne(mockTemplateId);

      expect(mockService.findOne).toHaveBeenCalledWith(mockTemplateId);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const updateDto = { name: 'Updated Template' };
      const updatedTemplate = { ...mockTemplate, ...updateDto };

      mockService.update.mockResolvedValue(updatedTemplate);

      const result = await controller.update(mockTemplateId, updateDto);

      expect(mockService.update).toHaveBeenCalledWith(mockTemplateId, updateDto);
      expect(result).toEqual(updatedTemplate);
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(mockTemplateId);

      expect(mockService.remove).toHaveBeenCalledWith(mockTemplateId);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template and create task', async () => {
      const applyDto = { title: 'Custom Title' };
      const mockTask: Task = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Custom Title',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        progress: 0,
        dueDate: null,
        assigneeId: mockUserId,
        assignee: null as any,
        parentId: null,
        metadata: { templateId: mockTemplateId },
        templateId: mockTemplateId,
        template: null as any,
        version: 1,
        startedAt: null,
        completedAt: null,
        blockedAt: null,
        blockReason: null,
        lastApiCallAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockService.applyTemplate.mockResolvedValue(mockTask);

      const result = await controller.applyTemplate(mockTemplateId, applyDto, mockRequest);

      expect(mockService.applyTemplate).toHaveBeenCalledWith(mockTemplateId, applyDto, mockUserId);
      expect(result).toEqual(mockTask);
    });
  });
});
