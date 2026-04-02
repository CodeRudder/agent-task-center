import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class TestWebhookDto {
  @ApiProperty({ example: 'task.created' })
  @IsString()
  eventType: string;

  @ApiProperty({ example: { taskId: 'uuid', title: '测试任务', description: '这是一个测试任务' } })
  @IsObject()
  payload: Record<string, any>;
}