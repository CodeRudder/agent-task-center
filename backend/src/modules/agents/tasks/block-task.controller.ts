import {
  Controller,
  Post,
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
import { TaskService } from '../../task/task.service';

@ApiTags('agent')
@ApiBearerAuth()
@Controller('api/v1/agent/tasks')
@UseGuards(AgentAuthGuard)
export class BlockTaskController {
  private readonly logger = new Logger(BlockTaskController.name);

  constructor(private readonly taskService: TaskService) {}

  @Post(':id/block')
  @ApiOperation({ summary: '标记任务阻塞' })
  @ApiResponse({ status: 200, description: '任务已标记为阻塞' })
  @ApiResponse({ status: 400, description: '任务状态不允许阻塞或缺少阻塞原因' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权阻塞此任务' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async blockTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
     @Request() req: any,
  ) {
    const { agentId } = req.agent;
    const { reason } = body;

    this.logger.log(`Agent ${agentId} blocking task ${id}`);

    // 验证阻塞原因
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        message: '阻塞原因不能为空',
        error: 'MISSING_BLOCK_REASON',
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
      this.logger.warn(`Agent ${agentId} attempted to block task ${id} assigned to ${task.assigneeId}`);
      throw new ForbiddenException({
        success: false,
        message: '无权阻塞此任务',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // 验证任务状态
    if (task.status === 'done') {
      throw new BadRequestException({
        success: false,
        message: '已完成的任务不能标记为阻塞',
        error: 'INVALID_STATUS',
        timestamp: new Date().toISOString(),
      });
    }

    // 更新状态为blocked，并设置阻塞时间和原因
    const updatedTask = await this.taskService.update(id, {
      status: 'blocked' as any,
      blockedAt: new Date(),
      blockReason: reason.trim(),
      lastApiCallAt: new Date(),
    } as any);

    this.logger.log(`Task ${id} blocked successfully with reason: ${reason}`);

    return {
      success: true,
      data: updatedTask,
      message: '任务已标记为阻塞',
      timestamp: new Date().toISOString(),
    };
  }
}
