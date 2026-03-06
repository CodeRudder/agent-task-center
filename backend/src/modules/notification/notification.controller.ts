import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, QueryNotificationDto, UpdateNotificationDto, MarkAsReadDto, PushNotificationDto } from './dto/notification.dto';
import { Notification } from './entities/notification.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current agent' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findAll(
    @Request() req: any,
    @Query() queryDto: QueryNotificationDto,
  ): Promise<{ items: Notification[]; total: number }> {
    return this.notificationService.findAll(req.user.id, queryDto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req: any): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: any,
  ): Promise<Notification> {
    return this.notificationService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @UseGuards(PermissionsGuard)
  @Permissions('notification:push')
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.create(createNotificationDto);
  }

  @Post('push')
  @ApiOperation({ summary: 'Push a notification to an agent' })
  @UseGuards(PermissionsGuard)
  @Permissions('notification:push')
  @ApiResponse({ status: 201, description: 'Notification pushed successfully' })
  async push(
    @Body() pushNotificationDto: PushNotificationDto,
    @Request() req: any,
  ): Promise<Notification> {
    return this.notificationService.push(pushNotificationDto, req.user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(
    @Request() req: any,
  ): Promise<{ count: number }> {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark specific notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAsRead(
    @Body() markAsReadDto: MarkAsReadDto,
    @Request() req: any,
  ): Promise<{ count: number }> {
    return this.notificationService.markAsRead(markAsReadDto.notificationIds, req.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markSingleAsRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: any,
  ): Promise<Notification> {
    return this.notificationService.update(id, { isRead: true, readAt: new Date() }, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: any,
  ): Promise<Notification> {
    return this.notificationService.update(id, updateNotificationDto, req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  async removeMany(
    @Body() body: { notificationIds: string[] },
    @Request() req: any,
  ): Promise<{ count: number }> {
    return this.notificationService.removeMany(body.notificationIds, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.notificationService.remove(id, req.user.id);
  }
}
