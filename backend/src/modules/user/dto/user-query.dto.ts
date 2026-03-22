import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({
    description: '页码',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为1' })
  @Max(100, { message: '每页数量最大为100' })
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: '按角色筛选',
    enum: ['admin', 'project_manager', 'user'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'project_manager', 'user'], {
    message: '角色必须是 admin、project_manager 或 user',
  })
  role?: string;

  @ApiPropertyOptional({
    description: '按状态筛选',
    enum: ['active', 'disabled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'disabled'], {
    message: '状态必须是 active 或 disabled',
  })
  status?: string;

  @ApiPropertyOptional({
    description: '搜索关键词（用户名或邮箱）',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
