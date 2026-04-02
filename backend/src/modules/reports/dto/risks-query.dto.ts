import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RisksQueryDto {
  @ApiProperty({ example: 'high,medium', description: 'Risk levels to include' })
  @IsOptional()
  @IsString()
  level?: string;
}