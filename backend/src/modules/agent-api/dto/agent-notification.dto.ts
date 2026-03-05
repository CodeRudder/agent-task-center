import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  MENTION = 'mention',
  ASSIGNMENT = 'assignment',
  COMPLETION = 'completion',
  COMMENT = 'comment',
}

export class QueryAgentNotificationsDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class MarkNotificationsReadDto {
  @ApiPropertyOptional({ type: [String], example: ['notif-uuid-1', 'notif-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationIds?: string[];

  @ApiPropertyOptional({ default: false, description: 'Mark all notifications as read' })
  @IsOptional()
  @IsBoolean()
  markAll?: boolean;
}
