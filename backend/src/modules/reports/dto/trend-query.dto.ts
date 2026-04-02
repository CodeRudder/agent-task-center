import { IsOptional, IsString, IsArray } from 'class-validator';
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
}
