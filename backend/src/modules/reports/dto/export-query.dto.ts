import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
}

export class ExportQueryDto {
  @ApiProperty({
    enum: ExportFormat,
    default: ExportFormat.CSV,
    required: false
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiProperty({
    example: 'tasks',
    required: false,
    description: 'Report type to export'
  })
  @IsOptional()
  type?: string;
}
