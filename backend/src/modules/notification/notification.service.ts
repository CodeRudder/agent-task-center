import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { QueryNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // New method for Phase 2-B API
  async findByAgent(
    agentId: string,
    query: QueryNotificationDto,
  ): Promise<{ items: Notification[]; total: number; unreadCount: number }> {
    const { page = 1, pageSize = 20, readStatus } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.agentId = :agentId', { agentId })
      .orderBy('notification.createdAt', 'DESC');

    // Filter by read status
    if (readStatus === 'true') {
      queryBuilder.andWhere('notification.read = :read', { read: true });
    } else if (readStatus === 'false') {
      queryBuilder.andWhere('notification.read = :read', { read: false });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: { agentId, read: false },
    });

    // Get paginated items
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, unreadCount };
  }

  // Legacy method for backward compatibility with agent-notifications.controller
  async getNotifications(
    agentId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // New method for Phase 2-B API
  async markAsRead(id: string, agentId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // Verify ownership
    if (notification.agentId !== agentId) {
      throw new ForbiddenException('无权操作此通知');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(agentId: string): Promise<void> {
    await this.notificationRepository.update(
      { agentId, read: false },
      { read: true },
    );
  }

  async create(
    agentId: string,
    type: string,
    title: string,
    content: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      agentId,
      type,
      title,
      content,
      data,
      read: false,
    });

    return this.notificationRepository.save(notification);
  }
}
