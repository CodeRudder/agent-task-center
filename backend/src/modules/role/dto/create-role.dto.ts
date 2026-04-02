import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: '产品负责人' })
  @IsString()
  name: string;

  @ApiProperty({ example: '负责产品需求的管理和评审', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: {
      tasks: ['view', 'create', 'edit', 'delete'],
      projects: ['view', 'edit'],
      reports: ['view', 'create', 'export']
    }
  })
  @IsObject()
  permissions: Record<string, string[]>;
}