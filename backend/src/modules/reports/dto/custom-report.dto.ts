import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsObject } from 'class-validator';

export class CustomReportDto {
  @ApiProperty({
    example: '自定义任务统计报表',
    description: 'Report name'
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: ['tasks', 'projects'],
    description: 'Data sources to include in the report'
  })
  @IsArray()
  @IsString({ each: true })
  dataSources: string[];

  @ApiProperty({
    example: { timeRange: '30d', groupBy: 'status' },
    required: false,
    description: 'Report filters and parameters'
  })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiProperty({
    example: ['completed', 'overdue', 'avgTime'],
    required: false,
    description: 'Metrics to calculate'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metrics?: string[];
}
