import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
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
export class GetTaskDetailsController {
  private readonly logger = new Logger(GetTaskDetailsController.name);

  constructor(private readonly taskService: TaskService) {}

  @Get(':id')
  @ApiOperation({ summary: '获取任务详情' })
  @ApiResponse({ status: 200, description: '成功返回任务详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限访问此任务' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async getTask(
    @Param('id', ParseUUIDPipe) id: string,
     @Request() req: any,
  ) {
    const { agentId } = req.agent;

    this.logger.log(`Agent ${agentId} requesting task details for ${id}`);

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
      this.logger.warn(`Agent ${agentId} attempted to access task ${id} assigned to ${task.assigneeId}`);
      throw new ForbiddenException({
        success: false,
        message: '无权访问此任务',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    };
  }
}
