import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: '企业微信通知' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'my-secret-key', required: false })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({ example: ['task.created', 'task.updated', 'task.completed'] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({ example: { 'Content-Type': 'application/json' } })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({ example: { 'msgtype': 'text', 'text': { 'content': '任务{{task.title}}已{{event.type}}' } } })
  @IsOptional()
  template?: Record<string, any>;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  retryCount?: number;

  @ApiProperty({ example: 5000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  projectId: string;
}
