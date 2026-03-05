import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { ApiTokenGuard } from '../auth/guards/api-token.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(ApiTokenGuard, PermissionsGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'Get notifications for current agent' })
  @ApiResponse({ status: 200, description: '返回通知列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getNotifications(
    @Query() query: QueryNotificationDto,
    @Request() req,
  ) {
    const result = await this.notificationService.findByAgent(
      req.user.id,
      query,
    );

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/read')
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: '通知已标记为已读' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权操作此通知' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
  ) {
    const notification = await this.notificationService.markAsRead(
      id,
      req.user.id,
    );

    return {
      success: true,
      data: notification,
      message: '通知已标记为已读',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('mark-all-read')
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: '所有通知已标记为已读' })
  @ApiResponse({ status: 401, description: '未授权' })
  async markAllAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);

    return {
      success: true,
      message: '所有通知已标记为已读',
      timestamp: new Date().toISOString(),
    };
  }
}
