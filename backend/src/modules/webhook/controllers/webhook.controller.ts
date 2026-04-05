import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { TestWebhookDto } from '../dto/test-webhook.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook configuration' })
  async create(@Body() createWebhookDto: CreateWebhookDto, @Request() req: any) {
    try {
      if (!req.user || !req.user.id) {
        throw new BadRequestException('User not authenticated');
      }
      return this.webhookService.create(createWebhookDto, req.user.id);
    } catch (error) {
      console.error('[WebhookController] Error creating webhook:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create webhook');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhook configurations' })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.webhookService.findAll({
      projectId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook configuration details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.webhookService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[WebhookController] Error finding webhook:', error);
      throw new BadRequestException('Failed to retrieve webhook');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook configuration' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    try {
      return this.webhookService.update(id, updateWebhookDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[WebhookController] Error updating webhook:', error);
      throw new BadRequestException('Failed to update webhook');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook configuration' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    try {
      await this.webhookService.remove(id, req.user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[WebhookController] Error removing webhook:', error);
      throw new BadRequestException('Failed to delete webhook');
    }
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test webhook' })
  async test(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() testWebhookDto: TestWebhookDto,
  ) {
    return this.webhookService.test(id, testWebhookDto);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook logs' })
  async getLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.webhookService.getLogs(id, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }
}