import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subtask } from '../entities/subtask.entity';
import { CreateSubtaskDto, UpdateSubtaskDto } from '../dto/subtask.dto';
import { Task } from '../entities/task.entity';

@Injectable()
export class SubtaskService {
  constructor(
    @InjectRepository(Subtask)
    private subtaskRepo: Repository<Subtask>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}

  async create(dto: CreateSubtaskDto): Promise<Subtask> {
    const task = await this.taskRepo.findOne({ where: { id: dto.taskId! } });
    if (!task) {
      throw new NotFoundException(`Task ${dto.taskId} not found`);
    }

    const subtask = this.subtaskRepo.create(dto);
    const saved = await this.subtaskRepo.save(subtask);
    
    await this.updateTaskProgress(dto.taskId!);
    
    return saved;
  }

  async findByTask(taskId: string): Promise<Subtask[]> {
    return this.subtaskRepo.find({
      where: { taskId },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Subtask> {
    const subtask = await this.subtaskRepo.findOne({ where: { id } });
    if (!subtask) {
      throw new NotFoundException(`Subtask ${id} not found`);
    }
    return subtask;
  }

  async update(id: string, dto: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.findOne(id);
    Object.assign(subtask, dto);
    const saved = await this.subtaskRepo.save(subtask);
    
    await this.updateTaskProgress(subtask.taskId);
    
    return saved;
  }

  async remove(id: string): Promise<void> {
    const subtask = await this.findOne(id);
    const taskId = subtask.taskId;
    await this.subtaskRepo.remove(subtask);
    await this.updateTaskProgress(taskId);
  }

  private async updateTaskProgress(taskId: string): Promise<void> {
    const subtasks = await this.subtaskRepo.find({ where: { taskId } });
    
    if (subtasks.length === 0) {
      return;
    }

    const completedCount = subtasks.filter(s => s.completed).length;
    const progress = Math.round((completedCount / subtasks.length) * 100);

    await this.taskRepo.update(taskId, { progress });
  }
}
