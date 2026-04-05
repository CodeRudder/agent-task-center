import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({
    message: '邮箱是必填字段'
  })
  @IsEmail({}, {
    message: '邮箱格式不正确'
  })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({
    message: '密码是必填字段'
  })
  @MinLength(6, {
    message: '密码长度至少6位'
  })
  password: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({
    message: '邮箱是必填字段'
  })
  @IsEmail({}, {
    message: '邮箱格式不正确'
  })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'e5ef11d62ed0fee321242acb0635d5ddd4a8a2f9410e15ea1f1eec68f612a6cc' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8, {
    message: '密码长度至少8位'
  })
  @MaxLength(20, {
    message: '密码长度不能超过20位'
  })
  newPassword: string;
}
