import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsHexColor } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: '标签名称', example: '紧急', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '标签描述', example: '紧急任务标签', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '标签颜色（HEX格式）', example: '#EF4444', default: '#3B82F6' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
