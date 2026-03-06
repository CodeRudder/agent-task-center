import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateProgressDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private dataSource: DataSource,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      creatorId: userId,
      assigneeId: createTaskDto.assigneeId || userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });

    return this.taskRepository.save(task);
  }

  async findAll(options: {
    status?: TaskStatus;
    assigneeId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Task[]; total: number }> {
    const { status, assigneeId, page = 1, pageSize = 10 } = options;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId?: string): Promise<Task> {
    const task = await this.findOne(id);

    // Permission check: only creator or assignee can update
    if (userId && task.creatorId !== userId && task.assigneeId !== userId) {
      throw new BadRequestException('You do not have permission to update this task');
    }

    // Optimistic locking
    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    const result = await this.taskRepository.update(id, updateData);

    if (result.affected === 0) {
      throw new BadRequestException('Task update failed - version conflict');
    }

    return this.findOne(id);
  }

  async updateProgress(
    id: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<Task> {
    const { progress } = updateProgressDto;

    // Use transaction for atomic update
    return this.dataSource.transaction(async (manager) => {
      const task = await manager.findOne(Task, { where: { id } });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      task.progress = progress;

      // Auto-update status based on progress
      if (progress === 100) {
        task.status = TaskStatus.DONE;
      } else if (progress > 0) {
        task.status = TaskStatus.IN_PROGRESS;
      }

      return manager.save(task);
    });
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.softDelete(id);
  }
}
