import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDependency } from '../entities/task-dependency.entity';
import {
  CreateTaskDependencyDto,
  UpdateTaskDependencyDto,
  CycleDetectionResponseDto,
} from '../dto/task-dependency.dto';

@Injectable()
export class TaskDependencyService {
  constructor(
    @InjectRepository(TaskDependency)
    private dependencyRepo: Repository<TaskDependency>,
  ) {}

  async create(dto: CreateTaskDependencyDto): Promise<TaskDependency> {
    const cycleCheck = await this.detectCycle(dto.taskId, dto.dependsOnTaskId);
    if (cycleCheck.hasCycle) {
      throw new BadRequestException(
        `Circular dependency detected: ${cycleCheck.cyclePath?.join(' -> ')}`,
      );
    }

    const existing = await this.dependencyRepo.findOne({
      where: { taskId: dto.taskId, dependsOnTaskId: dto.dependsOnTaskId },
    });
    if (existing) {
      throw new BadRequestException('Dependency already exists');
    }

    const dependency = this.dependencyRepo.create(dto);
    return this.dependencyRepo.save(dependency);
  }

  async findByTask(taskId: string): Promise<TaskDependency[]> {
    // ADR-002 v2.1: 移除关联查询
    return this.dependencyRepo.find({
      where: { taskId },
    });
  }

  async findOne(id: string): Promise<TaskDependency> {
    const dependency = await this.dependencyRepo.findOne({ where: { id } });
    if (!dependency) {
      throw new NotFoundException(`TaskDependency ${id} not found`);
    }
    return dependency;
  }

  async update(id: string, dto: UpdateTaskDependencyDto): Promise<TaskDependency> {
    const dependency = await this.findOne(id);
    if (dto.dependencyType !== undefined) {
      dependency.dependencyType = dto.dependencyType;
    }
    if (dto.isBlocking !== undefined) {
      dependency.isBlocking = dto.isBlocking;
    }
    if (dto.autoResolve !== undefined) {
      dependency.autoResolve = dto.autoResolve;
    }
    if (dto.resolveAfterHours !== undefined) {
      dependency.resolveAfterHours = dto.resolveAfterHours;
    }
    return this.dependencyRepo.save(dependency);
  }

  async remove(id: string): Promise<void> {
    const dependency = await this.findOne(id);
    await this.dependencyRepo.remove(dependency);
  }

  async detectCycle(
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<CycleDetectionResponseDto> {
    const visited = new Set<string>();
    const stack: string[] = [dependsOnTaskId];
    const path: string[] = [];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === taskId) {
        return {
          hasCycle: true,
          cyclePath: [...path, current],
        };
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      path.push(current);

      const dependencies = await this.dependencyRepo.find({
        where: { taskId: current },
      });

      for (const dep of dependencies) {
        stack.push(dep.dependsOnTaskId);
      }
    }

    return {
      hasCycle: false,
    };
  }

  async setDependencies(taskId: string, dependsOnTaskIds: string[]): Promise<TaskDependency[]> {
    // Step 1: Check for cycles in all new dependencies
    for (const dependsOnTaskId of dependsOnTaskIds) {
      const cycleCheck = await this.detectCycle(taskId, dependsOnTaskId);
      if (cycleCheck.hasCycle) {
        throw new BadRequestException(
          `Circular dependency detected: ${cycleCheck.cyclePath?.join(' -> ')}`,
        );
      }
    }

    // Step 2: Delete all existing dependencies for this task
    const existingDeps = await this.dependencyRepo.find({ where: { taskId } });
    if (existingDeps.length > 0) {
      await this.dependencyRepo.remove(existingDeps);
    }

    // Step 3: Create new dependencies
    const newDependencies: TaskDependency[] = [];
    for (const dependsOnTaskId of dependsOnTaskIds) {
      const dependency = this.dependencyRepo.create({
        taskId,
        dependsOnTaskId,
        dependencyType: 'finish_to_start' as any, // Default dependency type
        isBlocking: true, // Default to blocking
        autoResolve: false,
      });
      newDependencies.push(dependency);
    }

    // Step 4: Save all new dependencies
    if (newDependencies.length > 0) {
      await this.dependencyRepo.save(newDependencies);
    }

    return newDependencies;
  }
}
