import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDependency } from '../entities/task-dependency.entity';
import { Task } from '../entities/task.entity';
import { CreateTaskDependencyDto, UpdateTaskDependencyDto, ResolveAfterHoursDto, TaskDependencyGraphDto, CircularDependencyDto } from '../dto/task-dependency.dto';
import { TaskDependencyGraphDto as TaskDependencyGraphDtoResult, CircularDependencyDto as CircularDependencyDtoResult } from '../dto/task-dependency.dto';

@Injectable()
export class TaskDependencyService {
  constructor(
    @InjectRepository(TaskDependency)
    private readonly taskDependencyRepository: Repository<TaskDependency>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(taskId: string, createDependencyDto: CreateTaskDependencyDto): Promise<any> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependsOnTask = await this.taskRepository.findOne({ 
      where: { id: createDependencyDto.dependsOnTaskId } } 
    });
    if (!dependsOnTask) {
      throw new NotFoundException(`Task with ID ${createDependencyDto.dependsOnTaskId} not found`);
    }

    // Check for circular dependency
    const hasCircular = await this.checkCircular(taskId, createDependencyDto.dependsOnTaskId);
    if (hasCircular) {
      throw new BadRequestException(
        'Circular dependency detected. This dependency would create a loop.',
      );
    }

    const dependency = this.taskDependencyRepository.create({
      ...createDependencyDto,
      taskId,
    });

    const savedDependency = await this.taskDependencyRepository.save(dependency);
    return savedDependency;
  }

  async getDependenciesByTask(taskId: string): Promise<TaskDependencyGraphDto> {
    const dependencies = await this.taskDependencyRepository.find({
      where: { taskId },
      relations: ['task', 'dependsOnTask'],
      order: { createdAt: 'ASC' },
    });

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check if task is blocked by dependencies
    const isBlocked = await this.isTaskBlockedByDependencies(taskId);

    const dependencyGraph = dependencies.map(dep => ({
      id: dep.id,
      taskId: dep.taskId,
      taskTitle: task.title,
      taskStatus: task.status,
      dependsOnTaskId: dep.dependsOnTaskId,
      dependsOnTaskTitle: dep.dependsOnTask?.title || 'Unknown',
      dependsOnTaskStatus: dep.dependsOnTask?.status || 'Unknown',
      dependencyType: dep.dependencyType,
      isBlocking: dep.isBlocking,
      autoResolve: dep.autoResolve,
      resolveAfterHours: dep.resolveAfterHours,
      createdAt: dep.createdAt,
      updatedAt: dep.updatedAt,
    }));

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      isBlockedByDependency: isBlocked,
      dependencies: dependencyGraph,
    };
  }

  async update(taskId: string, dependencyId: string, updateDependencyDto: UpdateTaskDependencyDto): Promise<any> {
    const dependency = await this.taskDependencyRepository.findOne({
      where: { taskId, id: dependencyId },
    });
    if (!dependency) {
      throw new NotFoundException(`Task dependency with ID ${dependencyId} not found`);
    }

    // Check for circular dependency if dependsOnTaskId is changed
    if (updateDependencyDto.dependsOnTaskId && 
        updateDependencyDto.dependsOnTaskId !== dependency.dependsOnTaskId) {
      const hasCircular = await this.checkCircular(
        taskId, 
        updateDependencyDto.dependsOnTaskId
      );
      if (hasCircular) {
        throw new BadRequestException('Circular dependency detected');
      }
    }

    Object.assign(dependency, updateDependencyDto);
    const updatedDependency = await this.taskDependencyRepository.save(dependency);
    return updatedDependency;
  }

  async delete(taskId: string, dependencyId: string): Promise<void> {
    const dependency = await this.taskDependencyRepository.findOne({
      where: { taskId, id: dependencyId },
    });
    if (!dependency) {
      throw new NotFoundException(`Task dependency with ID ${dependencyId} not found`);
    }

    await this.taskDependencyRepository.remove(dependency);
  }

  async checkCircularDependencies(taskId: string): Promise<CircularDependencyDto> {
    const hasCircular = await this.checkCircular(taskId, taskId);
    const circularPath = hasCircular ? await this.findCircularPath(taskId, taskId) : [];

    return {
      path: circularPath,
      taskCount: circularPath.length,
      suggestion: hasCircular 
        ? 'Remove one of the dependencies in the loop to break the circular dependency'
        : 'No circular dependencies found',
    };
  }

  async autoResolve(taskId: string, resolveAfterHoursDto: ResolveAfterHoursDto): Promise<any> {
    const dependencies = await this.taskDependencyRepository.find({
      where: { taskId },
    });

    const resolvedDependencies = [];

    for (const dependency of dependencies) {
      if (dependency.autoResolve && dependency.resolveAfterHours !== null) {
        dependency.resolveAfterHours = resolveAfterHoursDto.resolveAfterHours;
        const updatedDependency = await this.taskDependencyRepository.save(dependency);
        resolvedDependencies.push(updatedDependency);
      }
    }

    return {
      message: 'Dependencies auto-resolved successfully',
      resolvedCount: resolvedDependencies.length,
      dependencies: resolvedDependencies,
    };
  }

  private async checkCircular(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Build adjacency map
    const dependencies = await this.taskDependencyRepository.find();
    const graph = new Map<string, string[]>();

    for (const dep of dependencies) {
      if (!graph.has(dep.taskId)) {
        graph.set(dep.taskId, []);
      }
      graph.get(dep.taskId).push(dep.dependsOnTaskId);
    }

    // DFS to check for cycle
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, stack: Set<string>): boolean => {
      visited.add(node);
      stack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, stack)) {
            return true;
          }
        } else if (stack.has(neighbor)) {
          return true;
        }
      }

      stack.delete(node);
      return false;
    };

    return dfs(taskId, recStack);
  }

  private async findCircularPath(taskId: string, dependsOnTaskId: string): Promise<string[]> {
    const dependencies = await this.taskDependencyRepository.find();
    const graph = new Map<string, string[]>();

    for (const dep of dependencies) {
      if (!graph.has(dep.taskId)) {
        graph.set(dep.taskId, []);
      }
      graph.get(dep.taskId).push(dep.dependsOnTaskId);
    }

    const visited = new Set<string>();
    const path: string[] = [];
    const parentMap = new Map<string, string>();

    for (const dep of dependencies) {
      parentMap.set(dep.dependsOnTaskId, dep.taskId);
    }

    const dfs = (node: string, currentPath: string[]): boolean => {
      visited.add(node);
      currentPath.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, currentPath)) {
            return true;
          }
        } else if (currentPath.includes(neighbor)) {
          // Found circular dependency
          const cycleStartIndex = currentPath.indexOf(neighbor);
          const cycle = currentPath.slice(cycleStartIndex);
          cycle.push(neighbor);
          currentPath.splice(0, cycleStartIndex);
          currentPath.push(...cycle);
          return true;
        }
      }

      currentPath.pop();
      return false;
    };

    dfs(taskId, path);
    return path;
  }

  private async isTaskBlockedByDependencies(taskId: string): Promise<boolean> {
    const dependencies = await this.taskDependencyRepository.find({
      where: { taskId },
    });

    if (dependencies.length === 0) return false;

    // Check if any dependency is blocking and the dependent task is not done
    for (const dep of dependencies) {
      if (dep.isBlocking) {
        const dependsOnTask = await this.taskRepository.findOne({
          where: { id: dep.dependsOnTaskId },
        });

        if (dependsOnTask && dependsOnTask.status !== 'done') {
          return true;
        }
      }
    }

    return false;
  }
}
