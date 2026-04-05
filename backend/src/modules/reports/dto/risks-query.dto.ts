import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RisksQueryDto {
  @ApiProperty({ example: 'high,medium', description: 'Risk levels to include' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ example: 'high', description: 'Risk threshold (high, medium, low)', required: false })
  @IsOptional()
  @IsString()
  threshold?: string;

  @ApiProperty({ example: '2026-01-01', description: 'Start date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'End date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}