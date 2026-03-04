import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory } from '../entities/task-template.entity';

export class QueryTemplateDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ enum: TemplateCategory })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'bug' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
