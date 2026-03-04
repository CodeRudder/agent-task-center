import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory } from '../entities/task-template.entity';
import { TaskPriority } from '../../task/entities/task.entity';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Bug Fix Template', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Template for bug fix tasks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TemplateCategory, default: TemplateCategory.GENERAL })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  defaultPriority?: TaskPriority;

  @ApiPropertyOptional({ example: 'Bug: {{description}}' })
  @IsOptional()
  @IsString()
  defaultTitle?: string;

  @ApiPropertyOptional({ example: 'Steps to reproduce:\n1. ...\n2. ...' })
  @IsOptional()
  @IsString()
  defaultDescription?: string;

  @ApiPropertyOptional({ example: { environment: 'production' } })
  @IsOptional()
  @IsObject()
  defaultMetadata?: Record<string, any>;

  @ApiPropertyOptional({ example: ['bug', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 60, description: 'Estimated time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
