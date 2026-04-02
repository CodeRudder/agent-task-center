import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Task, TaskStatus } from "../entities/task.entity";
import { TaskStatusHistory, ChangedByType } from "../entities/task-status-history.entity";
import { TaskStatusMachineService } from "./task-status-machine.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateProgressDto,
} from "../dto/task.dto";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskStatusHistory)
    private statusHistoryRepository: Repository<TaskStatusHistory>,
    private statusMachine: TaskStatusMachineService,
    private dataSource: DataSource,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      creatorId: userId,
      assigneeId: createTaskDto.assigneeId || userId,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
    });

    return this.taskRepository.save(task);
  }

  async findAll(options: {
    status?: TaskStatus;
    assigneeId?: string;
    search?: string; // 搜索参数
    page?: number;
    pageSize?: number;
    since?: string; // Phase 1: 增量查询 - 只返回指定时间后更新的任务
  }): Promise<{ items: Task[]; total: number }> {
    const { status, assigneeId, search, page = 1, pageSize = 10, since } = options;

    const queryBuilder = this.taskRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.assignee", "assignee")
      .where("task.deletedAt IS NULL");

    if (status) {
      queryBuilder.andWhere("task.status = :status", { status });
    }

    if (assigneeId) {
      queryBuilder.andWhere("task.assigneeId = :assigneeId", { assigneeId });
    }

    // 搜索功能：支持中英文模糊搜索
    if (search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Phase 1: 增量查询 - 只返回指定时间后更新的任务
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        queryBuilder.andWhere("task.updatedAt > :since", { since: sinceDate });
      }
    }


    queryBuilder
      .orderBy("task.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      // ADR-002: 移除statusHistories关联查询
      relations: ["assignee", "dependencies"],
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    // Calculate is_blocked_by_dependency
    let isBlockedByDependency = false;
    if (task.dependencies && task.dependencies.length > 0) {
      // Check if any blocking dependency is incomplete
      for (const dep of task.dependencies) {
        if (dep.isBlocking) {
          // Query the dependency task to check its status
          const depTask = await this.taskRepository.findOne({
            where: { id: dep.dependsOnTaskId },
            select: ['status'],
          });
          if (depTask && depTask.status !== TaskStatus.DONE) {
            isBlockedByDependency = true;
            break;
          }
        }
      }
    }

    // Add isBlockedByDependency to the response
    return {
      ...task,
      isBlockedByDependency,
    } as any;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId?: string,
  ): Promise<Task> {
    const task = await this.findOne(id);

    // Permission check: only creator or assignee can update
    if (userId && task.creatorId !== userId && task.assigneeId !== userId) {
      throw new BadRequestException(
        "You do not have permission to update this task",
      );
    }

    // Optimistic locking
    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    const result = await this.taskRepository.update(id, updateData);

    if (result.affected === 0) {
      throw new BadRequestException("Task update failed - version conflict");
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
        throw new NotFoundException("Task not found");
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

  /**
   * 更新任务状态
   */
  async updateStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
    userType: "user" | "agent" = "user",
    reason?: string,
  ): Promise<Task> {
    // 使用事务确保数据一致性
    return this.dataSource.transaction(async (manager) => {
      // 1. 查询任务
      const task = await manager.findOne(Task, {
        where: { id: taskId },
        // ADR-002: 移除statusHistories关联查询
        // relations: ["statusHistories"],
      });

      if (!task) {
        throw new NotFoundException("任务不存在");
      }

      const oldStatus = task.status;

      // 2. 验证状态流转
      this.statusMachine.validateTransition(oldStatus, newStatus);

      // 3. 检查是否需要原因
      if (this.statusMachine.requireReason(oldStatus, newStatus) && !reason) {
        throw new BadRequestException(
          `从 ${oldStatus} 流转到 ${newStatus} 需要填写原因`
        );
      }

      // 4. 创建状态变更记录
      const statusHistory = manager.create(TaskStatusHistory, {
        taskId,
        oldStatus,
        newStatus,
        changedBy: userId,
        changedByType: userType as ChangedByType,
        reason,
      });

      // 5. 更新任务状态
      task.status = newStatus;

      // 6. 保存到数据库
      await manager.save(task);
      await manager.save(statusHistory);

      return task;
    });
  }

  /**
   * 获取任务状态变更历史
   */
  async getStatusHistories(
    taskId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [items, total] = await this.statusHistoryRepository.findAndCount({
      where: { taskId },
      order: { changedAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["changer"],
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        oldStatus: item.oldStatus,
        newStatus: item.newStatus,
        changedBy: item.changedBy,
        changedByType: item.changedByType,
        reason: item.reason || undefined,
        changedAt: item.changedAt.toISOString(),
        changerName: item.changerName,
      })),
      total,
      page,
      limit,
    };
  }


  /**
   * 增量查询任务列表（Phase 1: 增量查询机制）
   * 支持基于游标的分页、过滤、排序
   */
  async findIncremental(options: {
    since?: string; // 游标（上次查询的最后一条记录的时间戳）
    limit?: number; // 每页数量，默认20
    status?: TaskStatus; // 状态过滤
    priority?: string; // 优先级过滤
    assigneeId?: string; // 负责人过滤
    sortBy?: string; // 排序字段
    sortOrder?: 'ASC' | 'DESC'; // 排序方向
  }): Promise<{
    data: Task[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    const {
      since,
      limit = 20,
      status,
      priority,
      assigneeId,
      sortBy = 'updatedAt',
      sortOrder = 'DESC',
    } = options;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.deletedAt IS NULL');

    // 增量查询：只返回指定时间后更新的任务
    if (since) {
      queryBuilder.andWhere('task.updatedAt > :since', { since: new Date(since) });
    }

    // 状态过滤
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    // 优先级过滤
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    // 负责人过滤
    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    // 排序
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder);

    // 分页：取limit + 1条数据，用于判断是否有更多数据
    queryBuilder.take(limit + 1);

    const tasks = await queryBuilder.getMany();

    // 判断是否有更多数据
    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, limit) : tasks;

    // 计算下一页的游标（最后一条记录的updatedAt时间戳）
    const nextCursor = data.length > 0 ? data[data.length - 1].updatedAt.toISOString() : null;

    return {
      data,
      hasMore,
      nextCursor,
    };
  }
  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.softDelete(id);
  }
}
