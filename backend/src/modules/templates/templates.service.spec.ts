import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplatesService } from './templates.service';
import { TaskTemplate, TemplateCategory } from './entities/task-template.entity';
import { Task, TaskStatus, TaskPriority } from '../task/entities/task.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templateRepository: Repository<TaskTemplate>;
  let taskRepository: Repository<Task>;

  const mockTemplateId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  
  const mockTemplate: Partial<TaskTemplate> = {
    id: mockTemplateId,
    name: 'Bug Fix Template',
    description: 'Template for bug fix tasks',
    category: TemplateCategory.DEVELOPMENT,
    defaultPriority: TaskPriority.HIGH,
    defaultTitle: 'Bug: {{description}}',
    defaultDescription: 'Steps to reproduce:\n1. ...',
    tags: ['bug', 'urgent'],
    estimatedMinutes: 60,
    usageCount: 0,
    isActive: true,
    createdById: mockUserId,
  };

  const mockTask: Partial<Task> = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Test Task',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    progress: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(TaskTemplate),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            softDelete: jest.fn(),
            increment: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templateRepository = module.get<Repository<TaskTemplate>>(
      getRepositoryToken(TaskTemplate),
    );
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
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

      jest.spyOn(templateRepository, 'create').mockReturnValue(mockTemplate as TaskTemplate);
      jest.spyOn(templateRepository, 'save').mockResolvedValue(mockTemplate as TaskTemplate);

      const result = await service.create(createDto, mockUserId);

      expect(templateRepository.create).toHaveBeenCalled();
      expect(templateRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const queryDto = { page: 1, pageSize: 10 };
      const mockResult = [[mockTemplate as TaskTemplate], 1];

      jest.spyOn(templateRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue(mockResult),
      } as any);

      const result = await service.findAll(queryDto);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by category', async () => {
      const queryDto = { page: 1, pageSize: 10, category: TemplateCategory.DEVELOPMENT };
      const mockResult = [[mockTemplate as TaskTemplate], 1];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue(mockResult),
      };

      jest.spyOn(templateRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter by keyword', async () => {
      const queryDto = { page: 1, pageSize: 10, keyword: 'bug' };
      const mockResult = [[mockTemplate as TaskTemplate], 1];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue(mockResult),
      };

      jest.spyOn(templateRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      jest.spyOn(templateRepository, 'findOne').mockResolvedValue(mockTemplate as TaskTemplate);

      const result = await service.findOne(mockTemplateId);

      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException when template not found', async () => {
      jest.spyOn(templateRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(mockTemplateId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a template successfully', async () => {
      const updateDto = { name: 'Updated Template' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as TaskTemplate);
      jest.spyOn(templateRepository, 'save').mockResolvedValue({
        ...mockTemplate,
        ...updateDto,
      } as TaskTemplate);

      const result = await service.update(mockTemplateId, updateDto);

      expect(result.name).toBe('Updated Template');
    });
  });

  describe('remove', () => {
    it('should soft delete a template', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as TaskTemplate);
      jest.spyOn(templateRepository, 'softDelete').mockResolvedValue({} as any);

      await service.remove(mockTemplateId);

      expect(templateRepository.softDelete).toHaveBeenCalledWith(mockTemplateId);
    });
  });

  describe('applyTemplate', () => {
    it('should create a task from template', async () => {
      const applyDto = {};

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as TaskTemplate);
      jest.spyOn(templateRepository, 'increment').mockResolvedValue({} as any);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as Task);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as Task);

      const result = await service.applyTemplate(mockTemplateId, applyDto, mockUserId);

      expect(templateRepository.increment).toHaveBeenCalledWith(
        { id: mockTemplateId },
        'usageCount',
        1,
      );
      expect(taskRepository.create).toHaveBeenCalled();
      expect(taskRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when template is inactive', async () => {
      const applyDto = {};
      const inactiveTemplate = { ...mockTemplate, isActive: false };

      jest.spyOn(service, 'findOne').mockResolvedValue(inactiveTemplate as TaskTemplate);

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

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as TaskTemplate);
      jest.spyOn(templateRepository, 'increment').mockResolvedValue({} as any);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as Task);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as Task);

      await service.applyTemplate(mockTemplateId, applyDto, mockUserId);

      expect(taskRepository.create).toHaveBeenCalledWith(
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

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as TaskTemplate);
      jest.spyOn(templateRepository, 'increment').mockResolvedValue({} as any);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as Task);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as Task);

      await service.applyTemplate(mockTemplateId, applyDto, mockUserId);

      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: new Date(applyDto.dueDate),
        }),
      );
    });
  });
});
