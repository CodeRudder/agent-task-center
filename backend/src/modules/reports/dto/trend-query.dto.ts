import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrendQueryDto {
  @ApiProperty({ example: '30d', description: 'Time range (e.g., 30d, 7d, 90d)' })
  @IsOptional()
  @IsString()
  timeRange?: string;

  @ApiProperty({ example: 'completed,overdue', description: 'Metrics to include' })
  @IsOptional()
  @IsString()
  metrics?: string;

  @ApiProperty({ example: '2026-01-01', description: 'Start date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'End date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
