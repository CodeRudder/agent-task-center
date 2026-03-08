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
import { TaskDependencyService } from '../services/task-dependency.service';
import { CreateTaskDependencyDto, UpdateTaskDependencyDto, ResolveAfterHoursDto } from '../dto/task-dependency.dto';
import { TaskDependencyGraphDto, CircularDependencyDto } from '../dto/task-dependency.dto';

@ApiTags('Task Dependencies')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class CreateDependencyController {
  constructor(private readonly taskDependencyService: TaskDependencyService) {}

  @Post(':id/dependencies')
  @ApiOperation({ summary: '创建任务依赖' })
  @ApiResponse({ status: 201, description: '依赖创建成功' })
  async createDependency(
    @Param('id') id: string,
    @Body() createDependencyDto: CreateTaskDependencyDto,
  ) {
    return this.taskDependencyService.create(id, createDependencyDto);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class GetDependenciesController {
  constructor(private readonly taskDependencyService: TaskDependencyService) {}

  @Get(':id/dependencies')
  @ApiOperation({ summary: '获取任务依赖关系' })
  @ApiResponse({ status: 200, description: '成功返回依赖关系' })
  async getDependencies(@Param('id') id: string) {
    return this.taskDependencyService.getDependenciesByTask(id);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class UpdateDependencyController {
  constructor(private readonly taskDependencyService: TaskDependencyService) {}

  @Patch(':id/dependencies/:dependencyId')
  @ApiOperation({ summary: '更新任务依赖' })
  @ApiResponse({ status: 200, description: '依赖更新成功' })
  async updateDependency(
    @Param('id') id: string,
    @Param('dependencyId') dependencyId: string,
    @Body() updateDependencyDto: UpdateTaskDependencyDto,
  ) {
    return this.taskDependencyService.update(id, dependencyId, updateDependencyDto);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class DeleteDependencyController {
  constructor(private readonly taskDependencyService: TaskDependencyService) {}

  @Delete(':id/dependencies/:dependencyId')
  @ApiOperation({ summary: '删除任务依赖' })
  @HttpCode(204)
  async deleteDependency(
    @Param('id') id: string,
    @Param('dependencyId') dependencyId: string,
  ) {
    await this.taskDependencyService.delete(id, dependencyId);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class CheckCircularController {
  constructor(private readonly taskDependencyService: TaskDependencyService) {}

  @Post(':id/dependencies/check-circular')
  @ApiOperation({ summary: '检查循环依赖' })
  @ApiResponse({ status: 200, description: '成功返回循环依赖检测结果' })
  async checkCircular(@Param('id') id: string) {
    return this.taskDependencyService.checkCircularDependencies(id);
  }
}

@ApiTags('Task Dependencies')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class AutoResolveController {
  constructor(private readonly taskDependencyService: TaskDependencyService) {}

  @Post(':id/dependencies/auto-resolve')
  @ApiOperation({ summary: '自动解决依赖' })
  @ApiResponse({ status: 200, description: '自动解决成功' })
  async autoResolve(
    @Param('id') id: string,
    @Body() resolveAfterHoursDto: ResolveAfterHoursDto,
  ) {
    return this.taskDependencyService.autoResolve(id, resolveAfterHoursDto);
  }
}
