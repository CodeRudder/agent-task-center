import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyTemplateDto {
  @ApiPropertyOptional({ description: 'Override default title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Override default description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Additional metadata to merge' })
  @IsOptional()
  @IsObject()
  customMetadata?: Record<string, any>;
}
