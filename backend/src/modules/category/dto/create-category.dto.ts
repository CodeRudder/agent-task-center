import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsHexColor } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: '产品设计', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '分类描述', example: '产品设计相关任务', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '分类颜色（HEX格式）', example: '#10B981', default: '#10B981' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
