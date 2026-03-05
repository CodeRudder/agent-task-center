import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto, QueryCommentsDto } from './dto/comment.dto';
import { ApiTokenGuard } from '../auth/guards/api-token.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(ApiTokenGuard, PermissionsGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':taskId/comments')
  @RequirePermissions('comment:create')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiResponse({ status: 201, description: '评论添加成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async addComment(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    // Ensure taskId from URL matches taskId in body
    createCommentDto.taskId = taskId;
    
    const comment = await this.commentService.create(
      createCommentDto,
      req.user.id,
    );
    
    return {
      success: true,
      data: comment,
      message: '评论添加成功',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':taskId/comments')
  @RequirePermissions('comment:read')
  @ApiOperation({ summary: 'Get comments for a task' })
  @ApiResponse({ status: 200, description: '返回评论列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getComments(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Query() query: QueryCommentsDto,
    @Request() req,
  ) {
    const result = await this.commentService.findByTask(taskId, {
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
