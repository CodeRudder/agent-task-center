import { IsString, IsBoolean, IsOptional, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubtaskDto {
  @ApiProperty({ description: '任务ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: '子任务标题' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '子任务描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSubtaskDto {
  @ApiPropertyOptional({ description: '子任务标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '子任务描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '是否完成' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class SubtaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  completed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
