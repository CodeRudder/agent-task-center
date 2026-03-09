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
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Task[]; total: number }> {
    const { status, assigneeId, page = 1, pageSize = 10 } = options;

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
      relations: ["assignee", "statusHistories"],
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return task;
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
        relations: ["statusHistories"],
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
        changerName: item.changer?.displayName,
      })),
      total,
      page,
      limit,
    };
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.softDelete(id);
  }
}
