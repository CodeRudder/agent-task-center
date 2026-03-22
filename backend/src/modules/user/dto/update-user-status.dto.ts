import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export class UpdateUserStatusDto {
  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus, { message: '状态必须是 active 或 disabled' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: UserStatus;
}
