import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TaskDependenciesService } from '../services/task-dependencies.service';
import { CreateTaskDependencyDto, UpdateTaskDependencyDto, ResolveDependencyDto, TaskDependencyResponseDto, TaskDependenciesResponseDto } from '../dto/task-dependency.dto';

@ApiTags('Task Dependencies')
@Controller('tasks/:taskId/dependencies')
@UseGuards(JwtAuthGuard)
export class CreateTaskDependencyController {
  constructor(private readonly taskDependenciesService: TaskDependenciesService) {}

  @Post()
  @ApiOperation({ summary: '添加任务依赖' })
  @ApiResponse({ status: 201, description: '依赖添加成功' })
  async createDependency(
    @Param('taskId') taskId: string,
    @Body() createTaskDependencyDto: CreateTaskDependencyDto,
  ) {
    return this.taskDependenciesService.create(taskId, createTaskDependencyDto);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks/:taskId/dependencies')
@UseGuards(JwtAuthGuard)
export class GetTaskDependenciesController {
  constructor(private readonly taskDependenciesService: TaskDependenciesService) {}

  @Get()
  @ApiOperation({ summary: '获取任务的所有依赖' })
  @ApiResponse({ status: 200, description: '成功返回依赖列表，包含循环依赖检测结果' })
  async getDependencies(@Param('taskId') taskId: string) {
    return this.taskDependenciesService.getDependenciesByTask(taskId);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks/:taskId/dependencies')
@UseGuards(JwtAuthGuard)
export class UpdateTaskDependencyController {
  constructor(private readonly taskDependenciesService: TaskDependenciesService) {}

  @Patch(':dependencyId')
  @ApiOperation({ summary: '更新任务依赖' })
  @ApiResponse({ status: 200, description: '依赖更新成功' })
  async updateDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
    @Body() updateTaskDependencyDto: UpdateTaskDependencyDto,
  ) {
    return this.taskDependenciesService.update(taskId, dependencyId, updateTaskDependencyDto);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks/:taskId/dependencies')
@UseGuards(JwtAuthGuard)
export class DeleteTaskDependencyController {
  constructor(private readonly taskDependenciesService: TaskDependenciesService) {}

  @Delete(':dependencyId')
  @ApiOperation({ summary: '删除任务依赖' })
  @HttpCode(204)
  async deleteDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
  ) {
    await this.taskDependenciesService.delete(taskId, dependencyId);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks/:taskId/dependencies')
@UseGuards(JwtAuthGuard)
export class ResolveTaskDependencyController {
  constructor(private readonly taskDependenciesService: TaskDependenciesService) {}

  @Patch(':dependencyId/resolve')
  @ApiOperation({ summary: '解决任务依赖' })
  @ApiResponse({ status: 200, description: '依赖解决成功' })
  async resolveDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
    @Body() resolveDependencyDto: ResolveDependencyDto,
  ) {
    return this.taskDependenciesService.resolve(taskId, dependencyId, resolveDependencyDto);
  }
}
