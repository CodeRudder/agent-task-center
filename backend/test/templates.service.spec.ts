import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TemplatesService } from '../src/modules/templates/templates.service';
import { TaskTemplate, TemplateCategory } from '../src/modules/templates/entities/task-template.entity';
import { Task, TaskStatus, TaskPriority } from '../src/modules/task/entities/task.entity';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templateRepository: Repository<TaskTemplate>;
  let taskRepository: Repository<Task>;

  const mockTemplateId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  
  const mockTemplate: TaskTemplate = {
    id: mockTemplateId,
    name: 'Bug Fix Template',
    description: 'Template for bug fix tasks',
    category: TemplateCategory.DEVELOPMENT,
    defaultPriority: TaskPriority.HIGH,
    defaultTitle: 'Bug: {{description}}',
    defaultDescription: 'Steps to reproduce:\n1. ...',
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

  const mockTask: Task = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Test Task',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    progress: 0,
    templateId: mockTemplateId,
    template: null as any,
    dueDate: null,
    assigneeId: mockUserId,
    assignee: null as any,
    parentId: null,
    metadata: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    startedAt: null,
    completedAt: null,
    blockedAt: null,
    blockReason: null,
    lastApiCallAt: null,
  };

  const mockTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    softDelete: jest.fn(),
    increment: jest.fn(),
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(TaskTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templateRepository = module.get<Repository<TaskTemplate>>(
      getRepositoryToken(TaskTemplate),
    );
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a template successfully', async () => {
      const createDto = {
        name: 'New Template',
        category: TemplateCategory.DEVELOPMENT,
        defaultPriority: TaskPriority.HIGH,
      };

      mockTemplateRepository.create.mockReturnValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.create(createDto, mockUserId);

      expect(mockTemplateRepository.create).toHaveBeenCalled();
      expect(mockTemplateRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTemplate], 1]),
      };

      mockTemplateRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by category', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTemplate], 1]),
      };

      mockTemplateRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ page: 1, pageSize: 10, category: TemplateCategory.DEVELOPMENT });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by keyword', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTemplate], 1]),
      };

      mockTemplateRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ page: 1, pageSize: 10, keyword: 'bug' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.findOne(mockTemplateId);

      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException when template not found', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockTemplateId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a template successfully', async () => {
      const updateDto = { name: 'Updated Template' };
      const updatedTemplate = { ...mockTemplate, name: 'Updated Template' };
      
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue(updatedTemplate);

      const result = await service.update(mockTemplateId, updateDto);

      expect(result.name).toBe('Updated Template');
    });
  });

  describe('remove', () => {
    it('should soft delete a template', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.softDelete.mockResolvedValue({} as any);

      await service.remove(mockTemplateId);

      expect(mockTemplateRepository.softDelete).toHaveBeenCalledWith(mockTemplateId);
    });
  });

  describe('applyTemplate', () => {
    it('should create a task from template', async () => {
      const applyDto = {};

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.increment.mockResolvedValue({} as any);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.applyTemplate(mockTemplateId, applyDto, mockUserId);

      expect(mockTemplateRepository.increment).toHaveBeenCalledWith(
        { id: mockTemplateId },
        'usageCount',
        1,
      );
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when template is inactive', async () => {
      const applyDto = {};
      const inactiveTemplate = { ...mockTemplate, isActive: false };

      mockTemplateRepository.findOne.mockResolvedValue(inactiveTemplate);

      await expect(
        service.applyTemplate(mockTemplateId, applyDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should override default values with applyDto', async () => {
      const applyDto = {
        title: 'Custom Title',
        description: 'Custom Description',
        assigneeId: '123e4567-e89b-12d3-a456-426614174003',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.increment.mockResolvedValue({} as any);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      await service.applyTemplate(mockTemplateId, applyDto, mockUserId);

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Title',
          description: 'Custom Description',
          assigneeId: applyDto.assigneeId,
        }),
      );
    });

    it('should set dueDate when provided', async () => {
      const applyDto = {
        dueDate: '2024-12-31T23:59:59Z',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.increment.mockResolvedValue({} as any);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      await service.applyTemplate(mockTemplateId, applyDto, mockUserId);

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: new Date(applyDto.dueDate),
        }),
      );
    });
  });
});
