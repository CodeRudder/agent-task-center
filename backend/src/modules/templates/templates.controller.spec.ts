import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TaskTemplate, TemplateCategory } from './entities/task-template.entity';
import { Task, TaskPriority } from '../task/entities/task.entity';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            applyTemplate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
    service = module.get<TemplatesService>(TemplatesService);
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

      jest.spyOn(service, 'create').mockResolvedValue(mockTemplate);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUserId);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const queryDto = { page: 1, pageSize: 10 };
      const mockResult = { items: [mockTemplate], total: 1 };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate);

      const result = await controller.findOne(mockTemplateId);

      expect(service.findOne).toHaveBeenCalledWith(mockTemplateId);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const updateDto = { name: 'Updated Template' };
      const updatedTemplate = { ...mockTemplate, ...updateDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedTemplate);

      const result = await controller.update(mockTemplateId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockTemplateId, updateDto);
      expect(result).toEqual(updatedTemplate);
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(mockTemplateId);

      expect(service.remove).toHaveBeenCalledWith(mockTemplateId);
    });
  });

  describe('applyTemplate', () => {
    it('should apply template and create task', async () => {
      const applyDto = { title: 'Custom Title' };
      const mockTask: Task = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Custom Title',
        description: '',
        status: 'todo' as any,
        priority: TaskPriority.HIGH,
        progress: 0,
        dueDate: null,
        assigneeId: mockUserId,
        assignee: null as any,
        parentId: null,
        metadata: { templateId: mockTemplateId },
        version: 1,
        templateId: mockTemplateId,
        template: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(service, 'applyTemplate').mockResolvedValue(mockTask);

      const result = await controller.applyTemplate(mockTemplateId, applyDto, mockRequest);

      expect(service.applyTemplate).toHaveBeenCalledWith(mockTemplateId, applyDto, mockUserId);
      expect(result).toEqual(mockTask);
    });
  });
});
