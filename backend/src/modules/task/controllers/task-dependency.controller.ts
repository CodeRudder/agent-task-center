import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaskDependencyService } from '../services/task-dependency.service';
import { CreateTaskDependencyDto, UpdateTaskDependencyDto } from '../dto/task-dependency.dto';

@ApiTags('task-dependencies')
@Controller('tasks/:taskId/dependencies')
export class TaskDependencyController {
  constructor(private readonly dependencyService: TaskDependencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task dependency' })
  create(@Param('taskId') taskId: string, @Body() dto: CreateTaskDependencyDto) {
    dto.taskId = taskId;
    return this.dependencyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dependencies for a task' })
  findAll(@Param('taskId') taskId: string) {
    return this.dependencyService.findByTask(taskId);
  }

  @Get('check-cycle')
  @ApiOperation({ summary: 'Check for circular dependencies' })
  async checkCycle(@Param('taskId') taskId: string) {
    return { taskId, message: 'Cycle detection available on dependency creation' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dependency by id' })
  findOne(@Param('id') id: string) {
    return this.dependencyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dependency' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDependencyDto) {
    return this.dependencyService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dependency' })
  remove(@Param('id') id: string) {
    return this.dependencyService.remove(id);
  }
}
