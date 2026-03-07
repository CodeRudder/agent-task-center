import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTokenGuard } from '../auth/guards/api-token.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CommentService } from '../comment/comment.service';
import { TaskService } from '../task/services/task.service';
import {
  CreateAgentCommentDto,
  QueryAgentCommentsDto,
} from './dto/agent-comment.dto';

@ApiTags('agent/comments')
@ApiBearerAuth()
@Controller('agent/tasks')
@UseGuards(ApiTokenGuard, PermissionsGuard)
export class AgentCommentsController {
  constructor(
    private readonly commentService: CommentService,
    private readonly taskService: TaskService,
  ) {}

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Agent添加任务评论' })
  @ApiResponse({ status: 201, description: '评论添加成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能对自己的任务添加评论' })
  async addComment(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createCommentDto: CreateAgentCommentDto,
    @Request() req: any,
  ) {
    // 验证任务所有权：只能对自己的任务添加评论
    const task = await this.taskService.findOne(taskId);
    if (task.assigneeId !== req.user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只能对自己的任务添加评论',
        },
      };
    }

    const comment = await this.commentService.create(
      taskId,
      req.user.id,
      createCommentDto,
    );

    return {
      success: true,
      data: comment,
      message: '评论添加成功',
    };
  }

  @Get(':taskId/comments')
  @ApiOperation({ summary: 'Agent获取任务评论列表' })
  @ApiResponse({ status: 200, description: '返回评论列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '只能查看自己任务的评论' })
  async getComments(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() query: QueryAgentCommentsDto,
    @Request() req: any,
  ) {
    // 验证任务所有权
    const task = await this.taskService.findOne(taskId);
    if (task.assigneeId !== req.user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只能查看自己任务的评论',
        },
      };
    }

    const { page = 1, pageSize = 20 } = query;
    const result = await this.commentService.findAllByTask(taskId, page, pageSize);

    return {
      success: true,
      data: result,
    };
  }
}
