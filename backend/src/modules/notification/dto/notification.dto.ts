import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';

export enum NotificationType {
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_UPDATED = 'task_updated',
  SYSTEM_MESSAGE = 'system_message',
  AGENT_MESSAGE = 'agent_message',
  COMMENT_ADDED = 'comment_added',
}

export enum NotificationStatus {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread',
}

export class CreateNotificationDto {
  @ApiProperty({ example: '88685f86-6f08-496b-a95f-2db11dced3e1' })
  @IsUUID()
  recipientId: string;

  @ApiPropertyOptional({ example: '88685f86-6f08-496b-a95f-2db11dced3e2' })
  @IsOptional()
  @IsUUID()
  senderId?: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.TASK_ASSIGNED })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New task assigned to you', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'You have been assigned a new task...', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: '88685f86-6f08-496b-a95f-2db11dced3e3' })
  @IsOptional()
  @IsUUID()
  relatedTaskId?: string;

  @ApiPropertyOptional({ example: '88685f86-6f08-496b-a95f-2db11dced3e4' })
  @IsOptional()
  @IsUUID()
  relatedCommentId?: string;
}

export class QueryNotificationDto {
  @ApiPropertyOptional({ enum: NotificationStatus, default: NotificationStatus.ALL })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  pageSize?: number;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ example: 'Updated notification title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'] })
  @IsUUID('4', { each: true })
  notificationIds: string[];
}

export class PushNotificationDto {
  @ApiProperty({ example: '88685f86-6f08-496b-a95f-2db11dced3e1' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Task updated' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Task status changed...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedTaskId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedCommentId?: string;
}
