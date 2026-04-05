import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ComparisonQueryDto {
  @ApiProperty({ example: 'team', description: 'Comparison type (team, project)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: '30d', description: 'Time range (e.g., 30d, 7d, 90d)' })
  @IsOptional()
  @IsString()
  timeRange?: string;

  @ApiProperty({ example: '2026-01-01,2026-03-31', description: 'Period 1 (start,end)', required: false })
  @IsOptional()
  @IsString()
  period1?: string;

  @ApiProperty({ example: '2026-04-01,2026-06-30', description: 'Period 2 (start,end)', required: false })
  @IsOptional()
  @IsString()
  period2?: string;

  @ApiProperty({ example: '2026-01-01', description: 'Start date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'End date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}