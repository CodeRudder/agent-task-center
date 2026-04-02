import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { Comment } from './entities/comment.entity';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 创建评论
  @Post()
  @ApiOperation({ summary: '创建评论' })
  async create(
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    return await this.commentService.create(req.user.id, createCommentDto);
  }

  // 查询任务的评论列表（更具体的路由，放在前面）
  @Get('task/:taskId')
  @ApiOperation({ summary: '查询任务的评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findByTaskId(
    @Param('taskId') taskId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return await this.commentService.findByTaskId(
      taskId,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  // 获取评论详情（BUG-016修复）
  @Get(':id')
  @ApiOperation({ summary: '获取评论详情' })
  async findOne(@Param('id') id: string): Promise<Comment> {
    return await this.commentService.findOne(id);
  }

  // 获取评论历史记录
  @Get(':id/history')
  @ApiOperation({ summary: '获取评论历史记录' })
  async getHistory(@Request() req: any, @Param('id') id: string) {
    return await this.commentService.getHistory(req.user.id, id);
  }

  // 创建评论回复（BUG-020修复）
  @Post(':id/replies')
  @ApiOperation({ summary: '创建评论回复' })
  async createReply(
    @Request() req: any,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    return await this.commentService.createReply(req.user.id, id, createCommentDto);
  }

  // 评论点赞（BUG-021修复）
  @Post(':id/like')
  @ApiOperation({ summary: '评论点赞' })
  async likeComment(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ message: string; likes: number }> {
    return await this.commentService.likeComment(req.user.id, id);
  }

  // 更新评论
  @Put(':id')
  @ApiOperation({ summary: '更新评论' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.commentService.update(req.user.id, id, updateCommentDto);
  }

  // 删除评论
  @Delete(':id')
  @ApiOperation({ summary: '删除评论' })
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.commentService.remove(req.user.id, id);
    return { message: '评论已删除' };
  }

  // 获取所有评论列表（BUG-015、BUG-020、BUG-021修复）
  @Get()
  @ApiOperation({ summary: '获取所有评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'taskId', required: false, type: String })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('taskId') taskId?: string,
  ) {
    return await this.commentService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      taskId,
    );
  }
}
