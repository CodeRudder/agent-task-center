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
export class UnblockTaskController {
  private readonly logger = new Logger(UnblockTaskController.name);

  constructor(private readonly taskService: TaskService) {}

  @Post(':id/unblock')
  @ApiOperation({ summary: '解除任务阻塞' })
  @ApiResponse({ status: 200, description: '任务阻塞已解除' })
  @ApiResponse({ status: 400, description: '任务状态不允许解除阻塞' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权解除此任务的阻塞' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async unblockTask(
    @Param('id', ParseUUIDPipe) id: string,
     @Request() req: any,
  ) {
    const { agentId } = req.agent;

    this.logger.log(`Agent ${agentId} unblocking task ${id}`);

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
      this.logger.warn(`Agent ${agentId} attempted to unblock task ${id} assigned to ${task.assigneeId}`);
      throw new ForbiddenException({
        success: false,
        message: '无权解除此任务的阻塞',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // 验证任务状态
    if (task.status !== 'blocked') {
      throw new BadRequestException({
        success: false,
        message: `任务状态为${task.status}，无法解除阻塞`,
        error: 'INVALID_STATUS',
        timestamp: new Date().toISOString(),
      });
    }

    // 更新状态为todo，并清除阻塞时间和原因
    const updatedTask = await this.taskService.update(id, {
      status: 'todo' as any,
      blockedAt: null,
      blockReason: null,
      lastApiCallAt: new Date(),
    } as any);

    this.logger.log(`Task ${id} unblocked successfully`);

    return {
      success: true,
      data: updatedTask,
      message: '任务阻塞已解除',
      timestamp: new Date().toISOString(),
    };
  }
}
