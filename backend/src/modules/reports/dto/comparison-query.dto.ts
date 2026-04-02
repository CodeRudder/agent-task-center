import { IsOptional, IsString } from 'class-validator';
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
}