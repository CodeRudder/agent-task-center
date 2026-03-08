import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common';
import { AgentAuthGuard } from '../guards/agent-auth.guard';
import { TaskService } from '../../task/services/task.service';

@ApiTags('agent')
@ApiBearerAuth()
@Controller('agent/tasks')
@UseGuards(AgentAuthGuard)
export class UpdateProgressController {
  private readonly logger = new Logger(UpdateProgressController.name);

  constructor(private readonly taskService: TaskService) {}

  @Patch(':id/progress')
  @ApiOperation({ summary: '更新任务进度' })
  @ApiResponse({ status: 200, description: '进度更新成功' })
  @ApiResponse({ status: 400, description: '无效的进度值' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权更新此任务' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { progress: number },
     @Request() req: any,
  ) {
    const { agentId } = req.agent;
    const { progress } = body;

    this.logger.log(`Agent ${agentId} updating progress for task ${id} to ${progress}%`);

    // 验证progress值
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new BadRequestException({
        success: false,
        message: '进度值必须在0-100之间',
        error: 'INVALID_PROGRESS',
        timestamp: new Date().toISOString(),
      });
    }

    const task = await this.taskService.findOne(id);

    if (!task) {
      this.logger.warn(`Task ${id} not found`);
      throw new NotFoundException({
        success: false,
        message: '任务不存在',
        error: 'TASK_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // 验证任务所有权
    if (task.assigneeId !== agentId) {
      this.logger.warn(`Agent ${agentId} attempted to update progress for task ${id} assigned to ${task.assigneeId}`);
      throw new ForbiddenException({
        success: false,
        message: '无权更新此任务',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // 更新进度和最后API调用时间
    const updatedTask = await this.taskService.update(id, {
      progress,
      lastApiCallAt: new Date(),
    } as any);

    this.logger.log(`Task ${id} progress updated successfully`);

    return {
      success: true,
      data: updatedTask,
      message: '进度更新成功',
      timestamp: new Date().toISOString(),
    };
  }
}
