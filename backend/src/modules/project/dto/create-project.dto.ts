import { IsString, IsOptional, IsNotEmpty, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', example: 'V5.4开发项目' })
  @IsString()
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(255, { message: '项目名称最多255个字符' })
  name: string;

  @ApiProperty({ description: '项目描述', example: '这是一个开发项目', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10000, { message: '项目描述最多10000个字符' })
  description?: string;

  @ApiProperty({ description: '项目状态', example: 'active', enum: ['active', 'archived', 'deleted'], default: 'active' })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: '项目状态最多20个字符' })
  status?: string;

  @ApiProperty({ description: '开始日期', example: '2026-03-27', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', example: '2026-04-15', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
