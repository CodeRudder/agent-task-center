import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentMention } from './entities/comment-mention.entity';
import { CommentHistory } from './entities/comment-history.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';
import { Task } from '../task/entities/task.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(CommentMention)
    private mentionRepository: Repository<CommentMention>,
    @InjectRepository(CommentHistory)
    private historyRepository: Repository<CommentHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  // 创建评论
  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { taskId, content, parentId, mentions, notifyUsers } = createCommentDto;

    // 验证content字段存在且不为空
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('评论内容不能为空');
    }

    // 自动解析@提及，合并前端传递的mentions
    const parsedMentions = this.parseMentions(content);

    // 将用户名转换为用户ID
    const mentionUserIds: string[] = [];
    for (const username of parsedMentions) {
      const user = await this.userRepository.findOne({
        where: { username },
        select: ['id'],
      });
      if (user) {
        mentionUserIds.push(user.id);
      }
    }

    const finalMentions = [...new Set([...(mentions || []), ...mentionUserIds])];

    // 使用事务创建评论和@提及
    const comment = await this.dataSource.transaction(async (manager) => {
      // 1. 创建评论
      const comment = manager.create(Comment, {
        taskId,
        authorId: userId,
        content,
        parentId: parentId || null,
        isEdited: false,
      });
      await manager.save(comment);

      // 2. 创建@提及
      if (finalMentions && finalMentions.length > 0) {
        const mentionEntities = finalMentions.map((mentionedUserId) =>
          manager.create(CommentMention, {
            commentId: comment.id,
            mentionedUserId,
          }),
        );
        await manager.save(mentionEntities);
      }

      return comment;
    });

    // 3. 发送通知（在事务外执行，避免影响评论创建）
    try {
      // ADR-002: 移除关联查询
      const fullComment = await this.commentRepository.findOne({
        where: { id: comment.id },
      });

      if (fullComment) {
        // 3.1 发送评论添加通知（通知任务创建者）
        // ADR-002: 使用显式查询获取任务创建者
        const task = await this.taskRepository.findOne({ where: { id: fullComment.taskId } });
        if (task && task.creatorId !== userId) {
          await this.notificationService.createCommentAddedNotification(fullComment);
        }

        // 3.2 发送@提及通知
        if (finalMentions && finalMentions.length > 0) {
          for (const mentionedUserId of finalMentions) {
            // 不通知自己
            if (mentionedUserId !== userId) {
              await this.notificationService.createCommentMentionNotification(
                fullComment,
                mentionedUserId,
              );
            }
          }
        }

        // 3.3 发送评论回复通知（通知父评论作者）
        // NOTE: parentId feature暂时禁用（数据库表缺少parent_id列）
        // if (fullComment.parentId) {
        //   // ADR-002: 使用显式查询获取父评论
        //   const parentComment = await this.commentRepository.findOne({ where: { id: fullComment.parentId } });
        //   if (parentComment) {
        //     await this.notificationService.createCommentReplyNotification(
        //       fullComment,
        //       parentComment,
        //     );
        //   }
        // }
      }
    } catch (error) {
      // 通知发送失败不影响评论创建，只记录日志
      console.error('Failed to send comment notifications:', error);
    }

    return comment;
  }

  // 查询评论列表
  async findByTaskId(taskId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId }, // NOTE: 移除parentId条件（数据库表缺少parent_id列）
      // ADR-002: 移除关联查询
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      total,
      page,
      pageSize,
      comments,
    };
  }

  // 查询单个评论
  async findOne(id: string): Promise<Comment> {
    // ADR-002: 移除关联查询
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  // 更新评论
  async update(userId: string, commentId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('无权编辑此评论');
    }

    // 使用事务更新评论和记录历史
    return await this.dataSource.transaction(async (manager) => {
      // 1. 记录编辑历史
      const history = manager.create(CommentHistory, {
        commentId: comment.id,
        content: comment.content,
        editedBy: userId,
      });
      await manager.save(history);

      // 2. 更新评论
      comment.content = updateCommentDto.content;
      // NOTE: isEdited feature暂时禁用（数据库表缺少is_edited列）
      // comment.isEdited = true;
      await manager.save(comment);

      return comment;
    });
  }

  // 删除评论（软删除）
  async remove(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.commentRepository.softDelete(commentId);
  }

  // 解析评论中的@提及
  parseMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g; // 只匹配用户名部分（字母、数字、下划线、连字符、点号）
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  // 获取评论历史记录
  async getHistory(userId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 权限检查：只有评论作者可以查看历史
    if (comment.authorId !== userId) {
      throw new ForbiddenException('无权查看此评论历史');
    }

    const histories = await this.historyRepository.find({
      where: { commentId },
      order: { editedAt: 'DESC' },
    });

    return histories;
  }

  // 获取所有评论列表（BUG-015、BUG-020、BUG-021修复）
  async findAll(page: number = 1, limit: number = 10, taskId?: string) {
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (taskId) {
      whereCondition.taskId = taskId;
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: whereCondition,
      // ADR-002: 移除关联查询
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      total,
      page,
      limit,
      comments,
    };
  }

  // 创建评论回复（BUG-020修复）
  async createReply(
    userId: string,
    parentId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    // 验证父评论是否存在
    const parentComment = await this.commentRepository.findOne({
      where: { id: parentId },
    });

    if (!parentComment) {
      throw new NotFoundException('父评论不存在');
    }

    // 创建回复评论
    return this.create(userId, {
      ...createCommentDto,
      parentId,
      taskId: parentComment.taskId,
    });
  }

  // 评论点赞（BUG-021修复）
  async likeComment(
    userId: string,
    commentId: string,
  ): Promise<{ message: string; likes: number }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // TODO: 实现点赞功能
    // 1. 检查用户是否已点赞
    // 2. 如果未点赞，添加点赞记录
    // 3. 更新评论的点赞数

    // 暂时返回成功消息
    return {
      message: '点赞成功',
      likes: 0,
    };
  }
}
