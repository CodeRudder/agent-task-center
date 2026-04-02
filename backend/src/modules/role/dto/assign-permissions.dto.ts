import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    example: ['tasks.view', 'tasks.create', 'projects.view'],
    description: 'Permission IDs to assign to the role'
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
