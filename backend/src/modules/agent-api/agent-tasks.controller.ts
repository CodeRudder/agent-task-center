import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTokenGuard } from '../auth/guards/api-token.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TaskService } from '../task/services/task.service';
import {
  CreateAgentTaskDto,
  UpdateProgressDto,
  CompleteTaskDto,
  QueryAgentTasksDto,
} from './dto/agent-task.dto';

@ApiTags('agent/tasks')
@ApiBearerAuth()
@Controller('agent/tasks')
@UseGuards(ApiTokenGuard, PermissionsGuard)
export class AgentTasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Agent创建任务' })
  @ApiResponse({ status: 201, description: '任务创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async createTask(
    @Body() createTaskDto: CreateAgentTaskDto,
    @Request() req: any,
  ) {
    // Agent创建任务，记录创建者
    const task = await this.taskService.create(createTaskDto, req.user.id);
    
    return {
      success: true,
      data: task,
      message: '任务创建成功',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Agent获取任务列表' })
  @ApiResponse({ status: 200, description: '返回任务列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getTasks(
    @Query() query: QueryAgentTasksDto,
    @Request() req: any,
  ) {
    // 只返回分配给该Agent的任务
    const result = await this.taskService.findAll({
      ...query,
      assigneeId: req.user.id, // 只查看自己的任务
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Agent获取任务详情' })
  @ApiResponse({ status: 200, description: '返回任务详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '任务不存在或无权限' })
  async getTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const task = await this.taskService.findOne(id);
    
    // 验证任务所有权：只能查看自己的任务
    if (task.assigneeId !== req.user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只能查看分配给自己的任务',
        },
      };
    }

    return {
      success: true,
      data: task,
    };
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Agent更新任务进度' })
  @ApiResponse({ status: 200, description: '进度更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能更新自己的任务' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Request() req: any,
  ) {
    // 先验证任务所有权
    const task = await this.taskService.findOne(id);
    if (task.assigneeId !== req.user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只能更新分配给自己的任务',
        },
      };
    }

    const updatedTask = await this.taskService.updateProgress(id, updateProgressDto);
    
    return {
      success: true,
      data: updatedTask,
      message: '进度更新成功',
    };
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Agent开始任务' })
  @ApiResponse({ status: 200, description: '任务已开始' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能开始自己的任务' })
  async startTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    // 验证任务所有权
    const task = await this.taskService.findOne(id);
    if (task.assigneeId !== req.user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只能开始分配给自己的任务',
        },
      };
    }

    // 更新状态为 IN_PROGRESS
    const updatedTask = await this.taskService.update(id, {
      status: 'in_progress' as any,
    });

    return {
      success: true,
      data: updatedTask,
      message: '任务已开始',
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Agent完成任务' })
  @ApiResponse({ status: 200, description: '任务已完成' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能完成自己的任务' })
  async completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeTaskDto: CompleteTaskDto,
    @Request() req: any,
  ) {
    // 验证任务所有权
    const task = await this.taskService.findOne(id);
    if (task.assigneeId !== req.user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只能完成分配给自己的任务',
        },
      };
    }

    // 更新状态为 DONE，进度为 100%
    const updatedTask = await this.taskService.update(id, {
      status: 'done' as any,
      progress: 100,
    });

    // TODO: 可以将 completeTaskDto.result 和 attachments 保存到任务元数据或评论中

    return {
      success: true,
      data: updatedTask,
      message: '任务已完成',
    };
  }
}
