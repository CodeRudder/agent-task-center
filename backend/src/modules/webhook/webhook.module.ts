import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './services/webhook.service';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookConfiguration } from './entities/webhook-configuration.entity';
import { WebhookLog } from './entities/webhook-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookConfiguration, WebhookLog]),
    HttpModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}