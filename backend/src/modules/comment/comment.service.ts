import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentMention } from './entities/comment-mention.entity';
import { CommentHistory } from './entities/comment-history.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';

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
    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  // 创建评论
  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { taskId, content, parentId, mentions, notifyUsers } = createCommentDto;

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
      // 获取完整的评论信息（包括关联数据）
      const fullComment = await this.commentRepository.findOne({
        where: { id: comment.id },
        relations: ['task', 'task.creator', 'parent', 'parent.author'],
      });

      if (fullComment) {
        // 3.1 发送评论添加通知（通知任务创建者）
        if (fullComment.task && fullComment.task.creatorId !== userId) {
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
        if (fullComment.parentId && fullComment.parent) {
          await this.notificationService.createCommentReplyNotification(
            fullComment,
            fullComment.parent,
          );
        }
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
      where: { taskId, parentId: IsNull() }, // 只查询顶级评论
      relations: ['author', 'mentions', 'mentions.mentionedUser', 'replies', 'replies.author'],
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
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'mentions', 'mentions.mentionedUser', 'histories', 'histories.editor'],
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
      comment.isEdited = true;
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
}
