import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
    });
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      userId,
      read: false,
      createdAt: new Date(),
    };

    // Store in Redis with 7 days TTL
    const key = `notifications:${userId}`;
    await this.redis.lpush(key, JSON.stringify(notification));
    await this.redis.expire(key, 7 * 24 * 60 * 60);

    return notification;
  }

  async getNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    const key = `notifications:${userId}`;
    const notifications = await this.redis.lrange(key, 0, limit - 1);

    return notifications.map((n) => JSON.parse(n));
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const key = `notifications:${userId}`;
    const notifications = await this.getNotifications(userId);

    const index = notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      await this.redis.lset(key, index, JSON.stringify(notifications[index]));
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter((n) => !n.read).length;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
