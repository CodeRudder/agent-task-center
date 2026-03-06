import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, UpdateProgressDto, AcceptTaskDto, RejectTaskDto } from './dto/task.dto';
import { Task, TaskStatus } from './entities/task.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
  ): Promise<Task> {
    return this.taskService.create(createTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<{ items: Task[]; total: number }> {
    return this.taskService.findAll({
      status,
      assigneeId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update task progress' })
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<Task> {
    return this.taskService.updateProgress(id, updateProgressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept task' })
  async accept(
    @Param('id') id: string,
    @Body() acceptTaskDto: AcceptTaskDto,
  ): Promise<Task> {
    return this.taskService.accept(id, acceptTaskDto.comment);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject task' })
  async reject(
    @Param('id') id: string,
    @Body() rejectTaskDto: RejectTaskDto,
  ): Promise<Task> {
    return this.taskService.reject(
      id,
      rejectTaskDto.reason,
      rejectTaskDto.requiredChanges,
    );
  }
}
