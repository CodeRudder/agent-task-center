import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  USER = 'user',
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: '用户角色',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole, { message: '角色必须是 admin、project_manager 或 user' })
  @IsNotEmpty({ message: '角色不能为空' })
  role: UserRole;
}
