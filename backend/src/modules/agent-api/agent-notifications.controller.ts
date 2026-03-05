import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTokenGuard } from '../auth/guards/api-token.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { NotificationService } from '../notification/notification.service';
import {
  QueryAgentNotificationsDto,
  MarkNotificationsReadDto,
} from './dto/agent-notification.dto';

@ApiTags('agent/notifications')
@ApiBearerAuth()
@Controller('agent/notifications')
@UseGuards(ApiTokenGuard, PermissionsGuard)
export class AgentNotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'Agent获取通知列表' })
  @ApiResponse({ status: 200, description: '返回通知列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getNotifications(
    @Query() query: QueryAgentNotificationsDto,
    @Request() req,
  ) {
    const { type, unreadOnly, page = 1, pageSize = 20 } = query;

    // 获取该Agent的通知
    let notifications = await this.notificationService.getNotifications(
      req.user.id,
      pageSize * page, // 简化分页，实际应该用Redis的LRANGE优化
    );

    // 过滤
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    // 分页
    const total = notifications.length;
    const startIndex = (page - 1) * pageSize;
    const items = notifications.slice(startIndex, startIndex + pageSize);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  }

  @Post('read')
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'Agent标记通知已读' })
  @ApiResponse({ status: 200, description: '已标记为已读' })
  @ApiResponse({ status: 401, description: '未授权' })
  async markAsRead(
    @Body() markReadDto: MarkNotificationsReadDto,
    @Request() req,
  ) {
    const { notificationIds, markAll } = markReadDto;

    if (markAll) {
      // 标记所有通知为已读
      const notifications = await this.notificationService.getNotifications(req.user.id);
      for (const notification of notifications) {
        if (!notification.read) {
          await this.notificationService.markAsRead(req.user.id, notification.id);
        }
      }

      return {
        success: true,
        message: '所有通知已标记为已读',
      };
    } else if (notificationIds && notificationIds.length > 0) {
      // 标记指定通知为已读
      for (const notificationId of notificationIds) {
        await this.notificationService.markAsRead(req.user.id, notificationId);
      }

      return {
        success: true,
        message: '指定通知已标记为已读',
      };
    }

    return {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: '请提供notificationIds或设置markAll为true',
      },
    };
  }
}
