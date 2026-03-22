import { ApiProperty } from '@nestjs/swagger';

class PermissionDto {
  @ApiProperty({ description: '权限ID' })
  id: number;

  @ApiProperty({ description: '权限名称' })
  name: string;

  @ApiProperty({ description: '资源类型' })
  resource: string;

  @ApiProperty({ description: '操作类型' })
  action: string;

  @ApiProperty({ description: '权限描述' })
  description: string;
}

export class UserResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ description: '显示名称' })
  displayName: string;

  @ApiProperty({ description: '角色' })
  role: string;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '最后登录时间', nullable: true })
  lastLoginAt: Date | null;
}

export class UserDetailResponseDto extends UserResponseDto {
  @ApiProperty({ description: '权限列表', type: [PermissionDto] })
  permissions: PermissionDto[];
}

export class UserListResponseDto {
  @ApiProperty({ description: '用户列表', type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;
}
