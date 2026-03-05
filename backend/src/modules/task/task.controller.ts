import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Delete,
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, UpdateProgressDto, QueryTaskDto } from './dto/task.dto';
import { 
  BatchCreateTaskDto, 
  BatchUpdateTaskDto, 
  BatchDeleteTaskDto, 
  BatchOperationResultDto,
  ExportTasksDto,
} from './dto/batch.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { ApiTokenGuard } from '../auth/guards/api-token.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CompleteTaskDto } from '../agent-api/dto/agent-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(ApiTokenGuard, PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermissions('task:create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: '任务创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
  ): Promise<{ success: boolean; data: Task; message: string; timestamp: string }> {
    const task = await this.taskService.create(createTaskDto, req.user.id);
    return {
      success: true,
      data: task,
      message: '任务创建成功',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @RequirePermissions('task:read')
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiResponse({ status: 200, description: '返回任务列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(
    @Query() query: QueryTaskDto,
    @Request() req,
  ): Promise<{ success: boolean; data: { items: Task[]; total: number }; timestamp: string }> {
    const result = await this.taskService.findAll({
      ...query,
      agentId: req.user.id, // 只返回该Agent有权限的任务
    });
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequirePermissions('task:read')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: '返回任务详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '任务不存在或无权限' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
  ): Promise<{ success: boolean; data: Task; timestamp: string }> {
    const task = await this.taskService.findOne(id, req.user.id);
    return {
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @RequirePermissions('task:update')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: '任务更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能更新自己的任务' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ): Promise<{ success: boolean; data: Task; message: string; timestamp: string }> {
    const task = await this.taskService.update(id, updateTaskDto, req.user.id);
    return {
      success: true,
      data: task,
      message: '任务更新成功',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/complete')
  @RequirePermissions('task:update')
  @ApiOperation({ summary: 'Complete a task' })
  @ApiResponse({ status: 200, description: '任务已完成' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能完成自己的任务' })
  async completeTask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() completeTaskDto: CompleteTaskDto,
    @Request() req,
  ): Promise<{ success: boolean; data: Task; message: string; timestamp: string }> {
    const task = await this.taskService.complete(id, completeTaskDto, req.user.id);
    return {
      success: true,
      data: task,
      message: '任务已完成',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @RequirePermissions('task:delete')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: '任务删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能删除自己的任务' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
  ): Promise<{ success: boolean; message: string; timestamp: string }> {
    await this.taskService.remove(id, req.user.id);
    return {
      success: true,
      message: '任务删除成功',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/progress')
  @RequirePermissions('task:update')
  @ApiOperation({ summary: 'Update task progress' })
  @ApiResponse({ status: 200, description: '进度更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updateProgress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Request() req,
  ): Promise<{ success: boolean; data: Task; message: string; timestamp: string }> {
    const task = await this.taskService.updateProgress(id, updateProgressDto, req.user.id);
    return {
      success: true,
      data: task,
      message: '进度更新成功',
      timestamp: new Date().toISOString(),
    };
  }

  // ========== 批量操作API ==========

  @Post('batch/create')
  @RequirePermissions('task:create')
  @ApiOperation({ summary: '批量创建任务（最多100个）' })
  async batchCreate(
    @Body() batchCreateDto: BatchCreateTaskDto,
    @Request() req,
  ): Promise<BatchOperationResultDto> {
    return this.taskService.batchCreate(batchCreateDto.tasks, req.user.id);
  }

  @Post('batch/update')
  @RequirePermissions('task:update')
  @ApiOperation({ summary: '批量编辑任务（最多500个）' })
  async batchUpdate(
    @Body() batchUpdateDto: BatchUpdateTaskDto,
    @Request() req,
  ): Promise<BatchOperationResultDto> {
    const { taskIds, ...updateData } = batchUpdateDto;
    return this.taskService.batchUpdate(taskIds, updateData, req.user.id);
  }

  @Post('batch/delete')
  @RequirePermissions('task:delete')
  @ApiOperation({ summary: '批量删除任务（最多200个）' })
  async batchDelete(
    @Body() batchDeleteDto: BatchDeleteTaskDto,
    @Request() req,
  ): Promise<BatchOperationResultDto> {
    return this.taskService.batchDelete(batchDeleteDto.taskIds, req.user.id);
  }

  @Get('export/tasks')
  @RequirePermissions('task:read')
  @ApiOperation({ summary: '导出任务' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['xlsx', 'csv'] })
  async exportTasks(
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('format') format?: 'xlsx' | 'csv',
    @Res() res?: Response,
  ) {
    const result = await this.taskService.exportTasks({
      status,
      assigneeId,
      format: format || 'xlsx',
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Post('import/tasks')
  @RequirePermissions('task:create')
  @ApiOperation({ summary: '导入任务（Excel/CSV）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importTasks(
    @UploadedFile() file: any,
    @Request() req,
  ): Promise<BatchOperationResultDto> {
    // 保存文件到临时目录
    const filePath = `/tmp/${file.originalname}`;
    require('fs').writeFileSync(filePath, file.buffer);
    
    return this.taskService.importTasks(filePath, req.user.id);
  }
}
