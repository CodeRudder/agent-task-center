import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AgentAuthGuard } from '../guards/agent-auth.guard';
import { TaskService } from '../../task/services/task.service';

@ApiTags('agent')
@ApiBearerAuth()
@Controller('agent/tasks')
@UseGuards(AgentAuthGuard)
export class GetTasksController {
  private readonly logger = new Logger(GetTasksController.name);

  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: '查询分配给Agent的任务列表' })
  @ApiResponse({ status: 200, description: '成功返回任务列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'status', required: false, description: '任务状态筛选' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getTasks(@Query() query: any, @Request() req: any) {
    const { agentId } = req.agent;
    const { status, page = 1, pageSize = 10 } = query;

    this.logger.log(`Agent ${agentId} querying tasks with filters: ${JSON.stringify(query)}`);

    const result = await this.taskService.findAll({
      assigneeId: agentId,
      status,
      page,
      pageSize,
    });

    return {
      success: true,
      data: result,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: result.total || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
