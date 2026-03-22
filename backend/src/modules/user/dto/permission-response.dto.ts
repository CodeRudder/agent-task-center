import { ApiProperty } from '@nestjs/swagger';

class PermissionDto {
  @ApiProperty({ description: '权限ID' })
  id: number;

  @ApiProperty({ description: '权限名称' })
  name: string;

  @ApiProperty({ description: '资源类型' })
  resourceType: string;

  @ApiProperty({ description: '操作类型' })
  action: string;

  @ApiProperty({ description: '权限描述' })
  description: string;
}

export class PermissionListResponseDto {
  @ApiProperty({ description: '权限列表', type: [PermissionDto] })
  permissions: PermissionDto[];
}

export class RoleDto {
  @ApiProperty({ description: '角色名称' })
  name: string;

  @ApiProperty({ description: '显示名称' })
  displayName: string;

  @ApiProperty({ description: '角色描述' })
  description: string;
}

export class RoleListResponseDto {
  @ApiProperty({ description: '角色列表', type: [RoleDto] })
  roles: RoleDto[];
}
