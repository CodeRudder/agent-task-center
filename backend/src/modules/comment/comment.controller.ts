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

  // 查询任务的评论列表
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
}
