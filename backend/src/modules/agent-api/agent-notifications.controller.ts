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
import { NotificationService } from '../notification/notification.service';
import { NotificationStatus } from '../notification/dto/notification.dto';
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
  @ApiOperation({ summary: 'Agent获取通知列表' })
  @ApiResponse({ status: 200, description: '返回通知列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getNotifications(
    @Query() query: QueryAgentNotificationsDto,
    @Request() req: any,
  ) {
    const { type, unreadOnly, page = 1, pageSize = 20 } = query;

    const result = await this.notificationService.findAll(req.user.id, {
      type: type as any,
      status: unreadOnly ? NotificationStatus.UNREAD : undefined,
      page,
      pageSize,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('read')
  @ApiOperation({ summary: 'Agent标记通知已读' })
  @ApiResponse({ status: 200, description: '已标记为已读' })
  @ApiResponse({ status: 401, description: '未授权' })
  async markAsRead(
    @Body() markReadDto: MarkNotificationsReadDto,
    @Request() req: any,
  ) {
    const { notificationIds, markAll } = markReadDto;

    if (markAll) {
      // 标记所有通知为已读
      const result = await this.notificationService.markAllAsRead(req.user.id);
      return {
        success: true,
        message: `已标记 ${result.count} 条通知为已读`,
      };
    } else if (notificationIds && notificationIds.length > 0) {
      // 标记指定通知为已读
      const result = await this.notificationService.markAsRead(notificationIds, req.user.id);
      return {
        success: true,
        message: `已标记 ${result.count} 条通知为已读`,
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
