import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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

  @Post('task/:taskId')
  @ApiOperation({ summary: 'Create a comment for a task' })
  async create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ): Promise<Comment> {
    return this.commentService.create(taskId, req.user.id, createCommentDto);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAllByTask(
    @Param('taskId') taskId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<{ items: Comment[]; total: number }> {
    return this.commentService.findAllByTask(
      taskId,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  async findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment' })
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: any,
  ): Promise<Comment> {
    return this.commentService.update(id, req.user.id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.commentService.remove(id, req.user.id);
  }
}
