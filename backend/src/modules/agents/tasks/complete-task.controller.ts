import {
  Controller,
  Post,
  Param,
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
@Controller('api/v1/agent/tasks')
@UseGuards(AgentAuthGuard)
export class CompleteTaskController {
  private readonly logger = new Logger(CompleteTaskController.name);

  constructor(private readonly taskService: TaskService) {}

  @Post(':id/complete')
  @ApiOperation({ summary: '完成任务' })
  @ApiResponse({ status: 200, description: '任务已完成' })
  @ApiResponse({ status: 400, description: '任务状态不允许完成' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权完成此任务' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async completeTask(
    @Param('id', ParseUUIDPipe) id: string,
     @Request() req: any,
  ) {
    const { agentId } = req.agent;

    this.logger.log(`Agent ${agentId} completing task ${id}`);

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
      this.logger.warn(`Agent ${agentId} attempted to complete task ${id} assigned to ${task.assigneeId}`);
      throw new ForbiddenException({
        success: false,
        message: '无权完成此任务',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // 验证任务状态
    if (task.status !== 'in_progress') {
      throw new BadRequestException({
        success: false,
        message: `任务状态为${task.status}，无法完成`,
        error: 'INVALID_STATUS',
        timestamp: new Date().toISOString(),
      });
    }

    // 更新状态为done，进度为100%，并设置完成时间
    const updatedTask = await this.taskService.update(id, {
      status: 'done' as any,
      progress: 100,
      completedAt: new Date(),
      lastApiCallAt: new Date(),
    } as any);

    this.logger.log(`Task ${id} completed successfully`);

    return {
      success: true,
      data: updatedTask,
      message: '任务已完成',
      timestamp: new Date().toISOString(),
    };
  }
}
