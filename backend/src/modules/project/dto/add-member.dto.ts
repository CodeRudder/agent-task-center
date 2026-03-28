import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberRole } from '../entities/project.entity';

export class AddMemberDto {
  @ApiProperty({ description: '用户ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId: string;

  @ApiProperty({ 
    description: '成员角色', 
    enum: ProjectMemberRole,
    example: ProjectMemberRole.MEMBER 
  })
  @IsEnum(ProjectMemberRole, { message: '角色必须是 owner、admin 或 member' })
  role: ProjectMemberRole;
}
