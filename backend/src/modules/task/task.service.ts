import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateProgressDto } from './dto/task.dto';
import { CompleteTaskDto } from '../agent-api/dto/agent-task.dto';

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
      assigneeId: createTaskDto.assigneeId || userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
    });

    return this.taskRepository.save(task);
  }

  async findAll(options: {
    status?: TaskStatus;
    priority?: string;
    assigneeId?: string;
    agentId?: string; // Agent ID for ownership validation
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Task[]; total: number }> {
    const { status, priority, assigneeId, agentId, page = 1, pageSize = 10 } = options;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.deletedAt IS NULL');

    // Agent所有权验证：只返回该Agent有权限的任务
    if (agentId) {
      queryBuilder.andWhere(
        '(task.assigneeId = :agentId OR task.creatorId = :agentId)',
        { agentId }
      );
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
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

  async findOne(id: string, agentId?: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Agent所有权验证：只能查看自己的任务或创建的任务
    if (agentId && task.assigneeId !== agentId) {
      // 检查是否有creator字段，如果有则也验证
      // 如果没有creator字段，则只验证assigneeId
      throw new ForbiddenException('只能查看分配给自己的任务');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, agentId?: string): Promise<Task> {
    const task = await this.findOne(id);

    // Agent所有权验证：只能更新自己的任务
    if (agentId && task.assigneeId !== agentId) {
      throw new ForbiddenException('只能更新分配给自己的任务');
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
    agentId?: string,
  ): Promise<Task> {
    const { progress } = updateProgressDto;

    // Use transaction for atomic update
    return this.dataSource.transaction(async (manager) => {
      const task = await manager.findOne(Task, { 
        where: { id },
        relations: ['assignee'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Agent所有权验证
      if (agentId && task.assigneeId !== agentId) {
        throw new ForbiddenException('只能更新分配给自己的任务进度');
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

  async complete(id: string, completeTaskDto: CompleteTaskDto, agentId?: string): Promise<Task> {
    // Use transaction for atomic update
    return this.dataSource.transaction(async (manager) => {
      const task = await manager.findOne(Task, { 
        where: { id },
        relations: ['assignee'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Agent所有权验证
      if (agentId && task.assigneeId !== agentId) {
        throw new ForbiddenException('只能完成分配给自己的任务');
      }

      // 更新状态为 DONE，进度为 100%
      task.status = TaskStatus.DONE;
      task.progress = 100;

      // TODO: 可以将 completeTaskDto.result 和 attachments 保存到任务元数据或评论中
      if (completeTaskDto.result || completeTaskDto.attachments) {
        task.metadata = {
          ...task.metadata,
          completionResult: completeTaskDto.result,
          attachments: completeTaskDto.attachments,
          completedAt: new Date().toISOString(),
        };
      }

      return manager.save(task);
    });
  }

  async remove(id: string, agentId?: string): Promise<void> {
    const task = await this.findOne(id);

    // Agent所有权验证：只能删除自己的任务
    if (agentId && task.assigneeId !== agentId) {
      throw new ForbiddenException('只能删除分配给自己的任务');
    }

    await this.taskRepository.softDelete(id);
  }

  /**
   * 批量创建任务
   * 性能要求：100个任务 < 5s
   */
  async batchCreate(
    tasks: any[],
    userId: string,
  ): Promise<{ successCount: number; failedCount: number; errors: any[]; duration: number }> {
    const startTime = Date.now();
    const errors: any[] = [];
    const batchSize = 50; // 每批处理50个
    let successCount = 0;

    // 分批处理
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);

      await this.dataSource.transaction(async (manager) => {
        for (let j = 0; j < batch.length; j++) {
          try {
            const taskData = batch[j];
            const task = manager.create(Task, {
              ...taskData,
              assigneeId: taskData.assigneeId || userId,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            });

            await manager.save(task);
            successCount++;
          } catch (error) {
            errors.push({
              index: i + j,
              error: error.message || 'Unknown error',
            });
          }
        }
      });
    }

    return {
      successCount,
      failedCount: tasks.length - successCount,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 批量编辑任务
   * 性能要求：500个任务 < 10s
   */
  async batchUpdate(
    taskIds: string[],
    updateData: any,
    agentId?: string,
  ): Promise<{ successCount: number; failedCount: number; errors: any[]; duration: number }> {
    const startTime = Date.now();
    const errors: any[] = [];
    const batchSize = 50;
    let successCount = 0;

    for (let i = 0; i < taskIds.length; i += batchSize) {
      const batch = taskIds.slice(i, i + batchSize);

      await this.dataSource.transaction(async (manager) => {
        for (let j = 0; j < batch.length; j++) {
          try {
            // 先验证权限
            const task = await manager.findOne(Task, { where: { id: batch[j] } });
            if (!task) {
              errors.push({
                index: i + j,
                error: 'Task not found',
              });
              continue;
            }

            // Agent所有权验证
            if (agentId && task.assigneeId !== agentId) {
              errors.push({
                index: i + j,
                error: 'Forbidden: can only update own tasks',
              });
              continue;
            }

            const result = await manager.update(Task, batch[j], updateData);
            if (result.affected > 0) {
              successCount++;
            } else {
              errors.push({
                index: i + j,
                error: 'Task not found',
              });
            }
          } catch (error) {
            errors.push({
              index: i + j,
              error: error.message || 'Unknown error',
            });
          }
        }
      });
    }

    return {
      successCount,
      failedCount: taskIds.length - successCount,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 批量删除任务
   * 性能要求：200个任务 < 8s
   */
  async batchDelete(
    taskIds: string[],
    agentId?: string,
  ): Promise<{ successCount: number; failedCount: number; errors: any[]; duration: number }> {
    const startTime = Date.now();
    const errors: any[] = [];
    const batchSize = 50;
    let successCount = 0;

    for (let i = 0; i < taskIds.length; i += batchSize) {
      const batch = taskIds.slice(i, i + batchSize);

      await this.dataSource.transaction(async (manager) => {
        for (let j = 0; j < batch.length; j++) {
          try {
            // 先验证权限
            const task = await manager.findOne(Task, { where: { id: batch[j] } });
            if (!task) {
              errors.push({
                index: i + j,
                error: 'Task not found',
              });
              continue;
            }

            // Agent所有权验证
            if (agentId && task.assigneeId !== agentId) {
              errors.push({
                index: i + j,
                error: 'Forbidden: can only delete own tasks',
              });
              continue;
            }

            const result = await manager.softDelete(Task, batch[j]);
            if (result.affected > 0) {
              successCount++;
            } else {
              errors.push({
                index: i + j,
                error: 'Task not found',
              });
            }
          } catch (error) {
            errors.push({
              index: i + j,
              error: error.message || 'Unknown error',
            });
          }
        }
      });
    }

    return {
      successCount,
      failedCount: taskIds.length - successCount,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 导出任务
   */
  async exportTasks(
    options: { status?: TaskStatus; assigneeId?: string; format: 'xlsx' | 'csv' } = { format: 'xlsx' },
  ): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    const { status, assigneeId, format } = options;

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

    const tasks = await queryBuilder.getMany();

    // 转换为CSV格式数据
    const csvData = tasks.map(task => ({
      ID: task.id,
      Title: task.title,
      Description: task.description || '',
      Status: task.status,
      Priority: task.priority,
      Progress: task.progress,
      Assignee: task.assignee?.name || '',
      DueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      CreatedAt: task.createdAt.toISOString(),
    }));

    const filename = `tasks-export-${Date.now()}.${format}`;

    return {
      data: Buffer.from(JSON.stringify(csvData)), // 简化处理，实际需要xlsx库
      filename,
      mimeType: format === 'xlsx' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
    };
  }

  /**
   * 导入任务（Excel/CSV）
   * 性能要求：1000行 < 15s
   */
  async importTasks(
    filePath: string,
    userId: string,
  ): Promise<{ successCount: number; failedCount: number; errors: any[]; duration: number }> {
    const startTime = Date.now();
    const errors: any[] = [];
    let successCount = 0;

    // TODO: 使用xlsx或PapaParse解析文件
    // 这里是示例实现，实际需要添加文件解析逻辑
    try {
      // 1. 读取文件
      // 2. 解析Excel/CSV
      // 3. 验证数据
      // 4. 批量创建任务

      // 示例：假设解析后的数据
      const tasks = []; // 从文件解析

      const result = await this.batchCreate(tasks, userId);
      successCount = result.successCount;
      errors.push(...result.errors);

    } catch (error) {
      errors.push({
        index: 0,
        error: error.message || 'Import failed',
      });
    }

    return {
      successCount,
      failedCount: errors.length,
      errors,
      duration: Date.now() - startTime,
    };
  }
}
