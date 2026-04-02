import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    example: ['uuid1', 'uuid2', 'uuid3'],
    description: 'User IDs to assign the role to'
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}