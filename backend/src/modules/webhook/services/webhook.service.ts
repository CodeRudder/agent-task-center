import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { WebhookConfiguration } from '../entities/webhook-configuration.entity';
import { WebhookLog } from '../entities/webhook-log.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { TestWebhookDto } from '../dto/test-webhook.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookConfiguration)
    private webhookRepository: Repository<WebhookConfiguration>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
    private httpService: HttpService,
  ) {}

  async create(createWebhookDto: CreateWebhookDto, userId: string): Promise<WebhookConfiguration> {
    // Auto-generate secret if not provided
    const secret = createWebhookDto.secret || this.generateSecret();

    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      secret,
      createdBy: userId,
      projectId: createWebhookDto.projectId,
    });

    return this.webhookRepository.save(webhook);
  }

  private generateSecret(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async findAll(options: {
    projectId?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: WebhookConfiguration[]; total: number }> {
    const { projectId, isActive, page = 1, pageSize = 20 } = options;

    const queryBuilder = this.webhookRepository.createQueryBuilder('webhook');

    if (projectId) {
      queryBuilder.andWhere('webhook.projectId = :projectId', { projectId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('webhook.isActive = :isActive', { isActive });
    }

    const [items, total] = await queryBuilder
      .orderBy('webhook.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<WebhookConfiguration> {
    const webhook = await this.webhookRepository.findOne({
      where: { id },
      relations: ['project', 'creator'],
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async update(id: string, updateWebhookDto: UpdateWebhookDto): Promise<WebhookConfiguration> {
    const webhook = await this.findOne(id);

    Object.assign(webhook, updateWebhookDto);

    return this.webhookRepository.save(webhook);
  }

  async remove(id: string, userId: string): Promise<void> {
    const webhook = await this.webhookRepository.findOne({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    // 权限检查：只有创建者可以删除webhook
    if (webhook.createdBy !== userId) {
      throw new Error('You do not have permission to delete this webhook');
    }

    await this.webhookRepository.remove(webhook);
  }

  async test(id: string, testWebhookDto: TestWebhookDto): Promise<any> {
    const webhook = await this.findOne(id);

    if (!webhook.isActive) {
      throw new BadRequestException('Webhook is not active');
    }

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(
          webhook.url,
          {
            eventType: testWebhookDto.eventType,
            payload: testWebhookDto.payload,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...webhook.headers,
            },
            timeout: webhook.timeout,
          },
        ),
      );

      // Log successful test
      await this.webhookLogRepository.save({
        webhook_id: webhook.id,
        event_type: testWebhookDto.eventType,
        payload: testWebhookDto.payload,
        response_code: response.status,
        response_body: JSON.stringify(response.data),
        status: 'success',
        attempt: 1,
      });

      return {
        success: true,
        responseCode: response.status,
        responseBody: response.data,
      };
    } catch (error) {
      // Log failed test
      await this.webhookLogRepository.save({
        webhook_id: webhook.id,
        event_type: testWebhookDto.eventType,
        payload: testWebhookDto.payload,
        response_code: error.response?.status || 500,
        response_body: JSON.stringify(error.response?.data || error.message),
        status: 'failed',
        attempt: 1,
        error_message: error.message,
      });

      throw new BadRequestException('Webhook test failed');
    }
  }

  async getLogs(id: string, options: { page?: number; pageSize?: number }): Promise<any> {
    const webhook = await this.findOne(id);

    const { page = 1, pageSize = 20 } = options;

    const queryBuilder = this.webhookLogRepository
      .createQueryBuilder('log')
      .where('log.webhook_id = :webhookId', { webhookId: id });

    const [items, total] = await queryBuilder
      .orderBy('log.executed_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data: items,
      total,
      page,
      pageSize,
    };
  }

  async triggerWebhook(eventType: string, payload: any): Promise<void> {
    // Find all active webhooks that listen to this event type
    const webhooks = await this.webhookRepository.find({
      where: { isActive: true },
      relations: ['project'],
    });

    for (const webhook of webhooks) {
      if (webhook.events.includes(eventType)) {
        await this.sendWebhook(webhook, eventType, payload);
      }
    }
  }

  private async sendWebhook(
    webhook: WebhookConfiguration,
    eventType: string,
    payload: any,
    attempt: number = 1,
  ): Promise<void> {
    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(
          webhook.url,
          {
            eventType,
            payload,
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': webhook.secret,
              ...webhook.headers,
            },
            timeout: webhook.timeout,
          },
        ),
      );

      // Log successful webhook
      await this.webhookLogRepository.save({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        response_code: response.status,
        response_body: JSON.stringify(response.data),
        status: 'success',
        attempt,
      });

      this.logger.log(`Webhook ${webhook.id} sent successfully for event ${eventType}`);
    } catch (error) {
      // Log failed webhook
      await this.webhookLogRepository.save({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        response_code: error.response?.status || 500,
        response_body: JSON.stringify(error.response?.data || error.message),
        status: 'failed',
        attempt,
        error_message: error.message,
      });

      // Retry logic
      if (attempt < webhook.retryCount) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.sendWebhook(webhook, eventType, payload, attempt + 1);
      } else {
        this.logger.error(`Webhook ${webhook.id} failed after ${attempt} attempts for event ${eventType}`);
      }
    }
  }
}