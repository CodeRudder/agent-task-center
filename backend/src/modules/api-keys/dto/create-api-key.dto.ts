import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: '第三方系统集成' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['tasks.view', 'tasks.create', 'projects.view'] })
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiProperty({ example: ['tasks.view', 'tasks.create', 'projects.view'], required: false })
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({ example: '2026-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
