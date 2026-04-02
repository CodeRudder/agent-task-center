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
    return this.webhookService.create(createWebhookDto, req.user.id);
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
    return this.webhookService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook configuration' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.webhookService.update(id, updateWebhookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook configuration' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    await this.webhookService.remove(id, req.user.id);
    return { success: true };
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