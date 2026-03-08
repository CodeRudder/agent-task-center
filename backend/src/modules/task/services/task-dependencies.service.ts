import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDependency } from '../entities/task-dependency.entity';
import { Task } from './task.entity';
import { CreateTaskDependencyDto, UpdateTaskDependencyDto, ResolveDependencyDto, TaskDependencyResponseDto, TaskDependenciesResponseDto } from '../dto/task-dependency.dto';

@Injectable()
export class TaskDependenciesService {
  private readonly logger = new Logger(TaskDependenciesService.name);
  private readonly dependencyGraph = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskDependency)
    private readonly taskDependencyRepository: Repository<TaskDependency>,
  ) {
    this.loadDependencyGraph();
  }

  async create(taskId: string, createTaskDependencyDto: CreateTaskDependencyDto): Promise<TaskDependencyResponseDto> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependsOnTask = await this.taskRepository.findOne({ where: { id: createTaskDependencyDto.dependsOnTaskId } });
    if (!dependsOnTask) {
      throw new NotFoundException(`Task with ID ${createTaskDependencyDto.dependsOnTaskId} not found`);
    }

    // Check for cyclic dependency
    const hasCyclicDependency = this.checkCyclicDependency(taskId, createTaskDependencyDto.dependsOnTaskId);
    if (hasCyclicDependency) {
      throw new BadRequestException(`Cyclic dependency detected: Task ${taskId} cannot depend on Task ${createTaskDependencyDto.dependsOnTaskId}`);
    }

    const dependency = this.taskDependencyRepository.create({
      taskId,
      dependsOnTaskId: createTaskDependencyDto.dependsOnTaskId,
      ...createTaskDependencyDto,
      isBlocking: createTaskDependencyDto.isBlocking || createTaskDependencyDto.dependencyType === 'blocking',
    });

    const savedDependency = await this.taskDependencyRepository.save(dependency);

    // Update task's is_blocked_by_dependency status
    await this.updateTaskBlockedStatus(taskId);

    // Update dependency graph
    this.updateDependencyGraph(taskId, createTaskDependencyDto.dependsOnTaskId);

    this.logger.log(`Created dependency from task ${taskId} to task ${createTaskDependencyDto.dependsOnTaskId}`);

    return this.toDependencyResponseDto(savedDependency, task, dependsOnTask);
  }

  async getDependenciesByTask(taskId: string): Promise<TaskDependenciesResponseDto> {
    const dependencies = await this.taskDependencyRepository.find({
      where: { taskId },
      relations: ['task', 'dependsOnTask'],
      order: { createdAt: 'ASC' },
    });

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check for cyclic dependency
    const hasCyclicDependency = this.checkTaskCyclicDependencies(taskId);

    return {
      taskId,
      hasCyclicDependency,
      cyclicPath: hasCyclicDependency ? this.getCyclicPath(taskId) : null,
      dependencies: dependencies.map(dep => this.toDependencyResponseDto(dep, task, dep.dependsOnTask)),
    };
  }

  async update(taskId: string, dependencyId: string, updateTaskDependencyDto: UpdateTaskDependencyDto): Promise<TaskDependencyResponseDto> {
    const dependency = await this.taskDependencyRepository.findOne({
      where: { id: dependencyId, taskId },
    });
    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
    }

    // Check for cyclic dependency if dependsOnTaskId changes
    if (updateTaskDependencyDto.dependsOnTaskId && updateTaskDependencyDto.dependsOnTaskId !== dependency.dependsOnTaskId) {
      const hasCyclicDependency = this.checkCyclicDependency(taskId, updateTaskDependencyDto.dependsOnTaskId);
      if (hasCyclicDependency) {
        throw new BadRequestException(`Cyclic dependency detected: Task ${taskId} cannot depend on Task ${updateTaskDependencyDto.dependsOnTaskId}`);
      }
    }

    Object.assign(dependency, updateTaskDependencyDto);
    
    if (updateTaskDependencyDto.dependencyType) {
      dependency.isBlocking = updateTaskDependencyDto.dependencyType === 'blocking';
    }

    const savedDependency = await this.taskDependencyRepository.save(dependency);

    // Update task's is_blocked_by_dependency status
    await this.updateTaskBlockedStatus(taskId);

    // Update dependency graph
    if (updateTaskDependencyDto.dependsOnTaskId) {
      this.updateDependencyGraph(taskId, updateTaskDependencyDto.dependsOnTaskId);
    }

    this.logger.log(`Updated dependency ${dependencyId}`);

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    const dependsOnTask = await this.taskRepository.findOne({ where: { id: savedDependency.dependsOnTaskId } });

    return this.toDependencyResponseDto(savedDependency, task, dependsOnTask);
  }

  async delete(taskId: string, dependencyId: string): Promise<void> {
    const dependency = await this.taskDependencyRepository.findOne({
      where: { id: dependencyId, taskId },
    });
    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
    }

    await this.taskDependencyRepository.remove(dependency);

    // Update task's is_blocked_by_dependency status
    await this.updateTaskBlockedStatus(taskId);

    // Update dependency graph
    this.removeDependencyFromGraph(taskId, dependency.dependsOnTaskId);

    this.logger.log(`Deleted dependency ${dependencyId}`);
  }

  async resolve(taskId: string, dependencyId: string, resolveDependencyDto: ResolveDependencyDto): Promise<TaskDependencyResponseDto> {
    const dependency = await this.taskDependencyRepository.findOne({
      where: { id: dependencyId, taskId },
    });
    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
    }

    dependency.isResolved = true;
    dependency.resolvedAt = new Date();

    if (resolveDependencyDto.reason) {
      dependency.description = resolveDependencyDto.reason;
    }

    const savedDependency = await this.taskDependencyRepository.save(dependency);

    // Update task's is_blocked_by_dependency status
    await this.updateTaskBlockedStatus(taskId);

    this.logger.log(`Resolved dependency ${dependencyId}`);

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    const dependsOnTask = await this.taskRepository.findOne({ where: { id: savedDependency.dependsOnTaskId } });

    return this.toDependencyResponseDto(savedDependency, task, dependsOnTask);
  }

  private async updateTaskBlockedStatus(taskId: string): Promise<void> {
    const dependencies = await this.taskDependencyRepository.find({
      where: { taskId, isResolved: false },
      relations: ['dependsOnTask'],
    });

    const hasBlockingDependency = dependencies.some(dep => 
      dep.isBlocking && dep.dependsOnTask && dep.dependsOnTask.status !== 'done'
    );

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (task) {
      task.isBlockedByDependency = hasBlockingDependency;
      await this.taskRepository.save(task);
    }
  }

  private loadDependencyGraph(): void {
    this.taskDependencyRepository.find({}).then(dependencies => {
      this.dependencyGraph.clear();
      dependencies.forEach(dep => {
        if (!this.dependencyGraph.has(dep.taskId)) {
          this.dependencyGraph.set(dep.taskId, new Set());
        }
        this.dependencyGraph.get(dep.taskId)!.add(dep.dependsOnTaskId);
      });
    });
  }

  private updateDependencyGraph(taskId: string, dependsOnTaskId: string): void {
    if (!this.dependencyGraph.has(taskId)) {
      this.dependencyGraph.set(taskId, new Set());
    }
    this.dependencyGraph.get(taskId)!.add(dependsOnTaskId);
  }

  private removeDependencyFromGraph(taskId: string, dependsOnTaskId: string): void {
    if (this.dependencyGraph.has(taskId)) {
      this.dependencyGraph.get(taskId)!.delete(dependsOnTaskId);
    }
  }

  private checkCyclicDependency(taskId: string, dependsOnTaskId: string): boolean {
    const visited = new Set<string>();
    const stack: string[] = [];

    const hasCycle = (currentTaskId: string, targetTaskId: string): boolean => {
      if (currentTaskId === targetTaskId) {
        return true;
      }

      if (visited.has(currentTaskId)) {
        return false;
      }

      visited.add(currentTaskId);
      stack.push(currentTaskId);

      const dependencies = this.dependencyGraph.get(currentTaskId) || new Set();
      
      for (const depId of dependencies) {
        if (hasCycle(depId, targetTaskId)) {
          this.logger.debug(`Cycle detected: ${[...stack, currentTaskId, depId].join(' -> ')}`);
          return true;
        }
      }

      stack.pop();
      return false;
    };

    return hasCycle(taskId, dependsOnTaskId);
  }

  private checkTaskCyclicDependencies(taskId: string): boolean {
    const visited = new Set<string>();
    const stack: string[] = [];

    const hasCycle = (currentTaskId: string): boolean => {
      if (visited.has(currentTaskId)) {
        return false;
      }

      visited.add(currentTaskId);
      stack.push(currentTaskId);

      const dependencies = this.dependencyGraph.get(currentTaskId) || new Set();
      
      for (const depId of dependencies) {
        if (hasCycle(depId)) {
          this.logger.debug(`Cycle detected in task dependencies: ${[...stack, currentTaskId, depId].join(' -> ')}`);
          return true;
        }
      }

      stack.pop();
      return false;
    };

    return hasCycle(taskId);
  }

  private getCyclicPath(taskId: string): string[] {
    const visited = new Set<string>();
    const path: string[] = [];
    const stack: string[] = [];

    const findCycle = (currentTaskId: string): boolean => {
      if (stack.includes(currentTaskId)) {
        const cycleIndex = stack.indexOf(currentTaskId);
        return path.slice(cycleIndex);
      }

      if (visited.has(currentTaskId)) {
        return [];
      }

      visited.add(currentTaskId);
      stack.push(currentTaskId);
      path.push(currentTaskId);

      const dependencies = this.dependencyGraph.get(currentTaskId) || new Set();
      
      for (const depId of dependencies) {
        const cycle = findCycle(depId);
        if (cycle.length > 0) {
          return cycle;
        }
      }

      path.pop();
      stack.pop();
      return [];
    };

    return findCycle(taskId);
  }

  private toDependencyResponseDto(
    dependency: TaskDependency,
    task: Task,
    dependsOnTask: Task,
  ): TaskDependencyResponseDto {
    return {
      id: dependency.id,
      taskId: dependency.taskId,
      dependsOnTaskId: dependency.dependsOnTaskId,
      dependencyType: dependency.dependencyType,
      isBlocking: dependency.isBlocking,
      description: dependency.description,
      autoResolve: dependency.autoResolve,
      resolveAfterHours: dependency.resolveAfterHours,
      isResolved: dependency.isResolved,
      resolvedAt: dependency.resolvedAt,
      createdAt: dependency.createdAt,
      updatedAt: dependency.updatedAt,
    };
  }
}
