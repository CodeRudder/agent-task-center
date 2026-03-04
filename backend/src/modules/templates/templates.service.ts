import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskTemplate, TemplateCategory } from './entities/task-template.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  QueryTemplateDto,
  ApplyTemplateDto,
} from './dto';
import { Task, TaskStatus, TaskPriority } from '../task/entities/task.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(TaskTemplate)
    private templateRepository: Repository<TaskTemplate>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(
    createTemplateDto: CreateTemplateDto,
    userId: string,
  ): Promise<TaskTemplate> {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      createdById: userId,
      tags: createTemplateDto.tags || [],
      usageCount: 0,
      isActive: createTemplateDto.isActive ?? true,
    });

    return this.templateRepository.save(template);
  }

  async findAll(
    queryDto: QueryTemplateDto,
  ): Promise<{ items: TaskTemplate[]; total: number }> {
    const { page = 1, pageSize = 10, category, isActive, keyword } = queryDto;

    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.deletedAt IS NULL');

    if (category) {
      queryBuilder.andWhere('template.category = :category', { category });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('template.isActive = :isActive', { isActive });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(template.name ILIKE :keyword OR template.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    queryBuilder
      .orderBy('template.usageCount', 'DESC')
      .addOrderBy('template.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<TaskTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<TaskTemplate> {
    const template = await this.findOne(id);

    Object.assign(template, updateTemplateDto);

    return this.templateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.softDelete(id);
  }

  async applyTemplate(
    id: string,
    applyDto: ApplyTemplateDto,
    userId: string,
  ): Promise<Task> {
    const template = await this.findOne(id);

    if (!template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    // Increment usage count
    await this.templateRepository.increment({ id }, 'usageCount', 1);

    // Create task from template
    const taskData: Partial<Task> = {
      title: applyDto.title || template.defaultTitle || template.name,
      description:
        applyDto.description || template.defaultDescription || template.description,
      priority: template.defaultPriority,
      status: TaskStatus.TODO,
      progress: 0,
      assigneeId: applyDto.assigneeId || userId,
      metadata: {
        ...template.defaultMetadata,
        templateId: id,
        templateName: template.name,
        ...applyDto.customMetadata,
      },
    };

    if (applyDto.dueDate) {
      taskData.dueDate = new Date(applyDto.dueDate);
    }

    const task = this.taskRepository.create(taskData);
    return this.taskRepository.save(task);
  }
}
