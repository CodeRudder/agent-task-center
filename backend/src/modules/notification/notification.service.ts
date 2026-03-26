import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationDto, PushNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async findAll(
    agentId: string,
    queryDto: QueryNotificationDto,
  ): Promise<{ items: Notification[]; total: number }> {
    const { status, type, page = 1, pageSize = 10 } = queryDto;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :agentId', { agentId });

    // Filter by status
    if (status === 'read') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: true });
    } else if (status === 'unread') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    // Filter by type
    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Get paginated results
    const items = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total };
  }

  async findOne(id: string, agentId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['recipient', 'sender', 'relatedTask'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipientId !== agentId) {
      throw new ForbiddenException('Access denied');
    }

    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: any,
    agentId: string,
  ): Promise<Notification> {
    const notification = await this.findOne(id, agentId);

    Object.assign(notification, updateNotificationDto);

    return await this.notificationRepository.save(notification);
  }

  async markAsRead(
    notificationIds: string[],
    agentId: string,
  ): Promise<{ count: number }> {
    // Verify all notifications belong to the agent
    const notifications = await this.notificationRepository.find({
      where: { id: notificationIds as any },
    });

    const invalidIds = notifications
      .filter(n => n.recipientId !== agentId)
      .map(n => n.id);

    if (invalidIds.length > 0) {
      throw new ForbiddenException(
        `Cannot mark notifications as read: ${invalidIds.join(', ')} do not belong to you`,
      );
    }

    const result = await this.notificationRepository.update(
      { id: notificationIds as any, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { count: result.affected || 0 };
  }

  async markAllAsRead(agentId: string): Promise<{ count: number }> {
    const result = await this.notificationRepository.update(
      { recipientId: agentId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { count: result.affected || 0 };
  }

  async remove(id: string, agentId: string): Promise<void> {
    const notification = await this.findOne(id, agentId);
    await this.notificationRepository.remove(notification);
  }

  async removeMany(notificationIds: string[], agentId: string): Promise<{ count: number }> {
    // Verify all notifications belong to the agent
    const notifications = await this.notificationRepository.find({
      where: { id: notificationIds as any },
    });

    const invalidIds = notifications
      .filter(n => n.recipientId !== agentId)
      .map(n => n.id);

    if (invalidIds.length > 0) {
      throw new ForbiddenException(
        `Cannot delete notifications: ${invalidIds.join(', ')} do not belong to you`,
      );
    }

    const result = await this.notificationRepository.delete({
      id: notificationIds as any,
    });

    return { count: result.affected || 0 };
  }

  async getUnreadCount(agentId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { recipientId: agentId, isRead: false },
    });
  }

  async push(pushNotificationDto: PushNotificationDto, senderId: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...pushNotificationDto,
      senderId,
    });

    return await this.notificationRepository.save(notification);
  }

  async createTaskCreatedNotification(task: any): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipientId: task.creatorId,
      type: NotificationType.TASK_CREATED,
      title: 'New task created',
      content: `Task "${task.title}" has been created successfully.`,
      relatedTaskId: task.id,
    });

    return await this.notificationRepository.save(notification);
  }

  async createTaskAssignedNotification(task: any): Promise<Notification | null> {
    if (!task.assigneeId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipientId: task.assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New task assigned',
      content: `You have been assigned task "${task.title}".`,
      relatedTaskId: task.id,
    });

    return await this.notificationRepository.save(notification);
  }

  async createTaskCompletedNotification(task: any): Promise<Notification | null> {
    if (!task.creatorId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipientId: task.creatorId,
      type: NotificationType.TASK_COMPLETED,
      title: 'Task completed',
      content: `Task "${task.title}" has been completed.`,
      relatedTaskId: task.id,
    });

    return await this.notificationRepository.save(notification);
  }

  async createCommentAddedNotification(comment: any): Promise<Notification | null> {
    if (!comment.task?.creatorId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipientId: comment.task.creatorId,
      senderId: comment.authorId,
      type: NotificationType.COMMENT_ADDED,
      title: 'New comment added',
      content: `A new comment has been added to task "${comment.task.title}".`,
      relatedTaskId: comment.taskId,
      relatedCommentId: comment.id,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * 创建@提及通知
   * @param comment 评论对象
   * @param mentionedUserId 被@的用户ID
   * @returns 创建的通知对象
   */
  async createCommentMentionNotification(
    comment: any,
    mentionedUserId: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipientId: mentionedUserId,
      senderId: comment.authorId,
      type: NotificationType.COMMENT_MENTION,
      title: 'You were mentioned in a comment',
      content: `You were mentioned in a comment on task "${comment.task?.title || 'Unknown task'}".`,
      relatedTaskId: comment.taskId,
      relatedCommentId: comment.id,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * 创建评论回复通知
   * @param comment 回复评论对象
   * @param parentComment 父评论对象
   * @returns 创建的通知对象
   */
  async createCommentReplyNotification(
    comment: any,
    parentComment: any,
  ): Promise<Notification | null> {
    // 如果回复自己的评论，不发送通知
    if (comment.authorId === parentComment.authorId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipientId: parentComment.authorId,
      senderId: comment.authorId,
      type: NotificationType.COMMENT_REPLY,
      title: 'Your comment received a reply',
      content: `Your comment on task "${comment.task?.title || 'Unknown task'}" received a reply.`,
      relatedTaskId: comment.taskId,
      relatedCommentId: comment.id,
    });

    return await this.notificationRepository.save(notification);
  }
}
