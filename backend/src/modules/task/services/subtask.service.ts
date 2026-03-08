import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subtask } from '../entities/subtask.entity';
import { Task } from '../../task/entities/task.entity';
import { CreateSubtaskDto, UpdateSubtaskDto, UpdateProgressDto, SubtaskResponseDto } from '../dto/subtask.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskProgressUpdatedEvent } from '../events/task-progress-updated.event';

@Injectable()
export class SubtaskService {
  constructor(
    @InjectRepository(Subtask)
    private readonly subtaskRepository: Repository<Subtask>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createSubtaskDto: CreateSubtaskDto): Promise<SubtaskResponseDto> {
    const task = await this.taskRepository.findOne({ where: { id: createSubtaskDto.taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${createSubtaskDto.taskId} not found`);
    }

    const subtask = this.subtaskRepository.create({
      ...createSubtaskDto,
      taskId: createSubtaskDto.taskId,
      status: 'todo',
      progress: 0,
      createdBy: createSubtaskDto.createdBy,
    });

    const savedSubtask = await this.subtaskRepository.save(subtask);

    // Update parent task's subtask count
    await this.taskRepository.increment({ id: task.id }, 'subtaskCount', 1);

    return this.toSubtaskResponseDto(savedSubtask);
  }

  async getSubtasksByTask(taskId: string): Promise<SubtaskResponseDto[]> {
    const subtasks = await this.subtaskRepository.find({
      where: { taskId, deletedAt: null },
      relations: ['task', 'assignedToUser'],
      order: { createdAt: 'ASC' },
    });

    return subtasks.map(subtask => this.toSubtaskResponseDto(subtask));
  }

  async update(id: string, updateSubtaskDto: UpdateSubtaskDto): Promise<SubtaskResponseDto> {
    const subtask = await this.subtaskRepository.findOne({ where: { id } });
    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    // Handle status change to completed
    if (updateSubtaskDto.isCompleted && subtask.status !== 'done') {
      subtask.status = 'done';
      subtask.progress = 100;
      subtask.completedAt = new Date();

      // Recalculate parent task progress
      await this.recalculateParentTaskProgress(subtask.taskId);

      // Emit event
      this.eventEmitter.emit('task.progress.updated', new TaskProgressUpdatedEvent(subtask.taskId));
    } else {
      Object.assign(subtask, updateSubtaskDto);
      subtask.updatedBy = updateSubtaskDto.updatedBy;
    }

    const updatedSubtask = await this.subtaskRepository.save(subtask);
    return this.toSubtaskResponseDto(updatedSubtask);
  }

  async delete(id: string): Promise<void> {
    const subtask = await this.subtaskRepository.findOne({ where: { id } });
    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    await this.subtaskRepository.remove(subtask);

    // Update parent task's subtask count
    await this.taskRepository.decrement({ id: subtask.taskId }, 'subtaskCount', 1);

    // Recalculate parent task progress
    await this.recalculateParentTaskProgress(subtask.taskId);

    // Emit event
    this.eventEmitter.emit('task.progress.updated', new TaskProgressUpdatedEvent(subtask.taskId));
  }

  async updateProgress(id: string, updateProgressDto: UpdateProgressDto): Promise<SubtaskResponseDto> {
    const subtask = await this.subtaskRepository.findOne({ where: { id } });
    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    if (updateProgressDto.progress < 0 || updateProgressDto.progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    subtask.progress = updateProgressDto.progress;

    if (updateProgressDto.completedAt) {
      subtask.completedAt = new Date(updateProgressDto.completedAt);
      if (subtask.progress === 100 && subtask.status !== 'done') {
        subtask.status = 'done';
        await this.recalculateParentTaskProgress(subtask.taskId);
        this.eventEmitter.emit('task.progress.updated', new TaskProgressUpdatedEvent(subtask.taskId));
      }
    }

    const updatedSubtask = await this.subtaskRepository.save(subtask);
    return this.toSubtaskResponseDto(updatedSubtask);
  }

  private async recalculateParentTaskProgress(taskId: string): Promise<void> {
    const subtasks = await this.subtaskRepository.find({
      where: { taskId, deletedAt: null },
      relations: ['task'],
    });

    if (subtasks.length === 0) return;

    const totalProgress = subtasks.reduce((sum, subtask) => sum + subtask.progress, 0);
    const avgProgress = Math.round(totalProgress / subtasks.length);

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) return;

    task.progress = avgProgress;

    // Update task status based on subtasks
    const allSubtasksCompleted = subtasks.every(s => s.status === 'done');
    if (allSubtasksCompleted && task.status !== 'done') {
      task.status = 'review';
    } else if (!allSubtasksCompleted && task.status === 'review') {
      task.status = 'in_progress';
    }

    await this.taskRepository.save(task);
  }

  private toSubtaskResponseDto(subtask: Subtask): SubtaskResponseDto {
    return {
      id: subtask.id,
      taskId: subtask.taskId,
      parentId: subtask.parentId,
      title: subtask.title,
      description: subtask.description,
      progress: subtask.progress,
      status: subtask.status,
      priority: subtask.priority,
      dueDate: subtask.dueDate,
      completedAt: subtask.completedAt,
      assignedToId: subtask.assignedToId,
      createdBy: subtask.createdBy,
      updatedBy: subtask.updatedBy,
      createdAt: subtask.createdAt,
      updatedAt: subtask.updatedAt,
      deletedAt: subtask.deletedAt,
    };
  }
}
