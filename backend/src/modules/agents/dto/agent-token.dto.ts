import { ApiProperty } from '@nestjs/swagger';

export class AgentTokenResponseDto {
  @ApiProperty({ description: 'API Token (仅显示一次)', example: 'at_a1b2c3d4e5f6...' })
  token: string;

  @ApiProperty({ description: '提示信息', example: 'Token仅显示一次，请妥善保管' })
  message: string;

  @ApiProperty({ description: 'Agent ID' })
  agentId: string;
}

export class AgentAuthVerifyResponseDto {
  @ApiProperty({ description: '验证是否成功' })
  success: boolean;

  @ApiProperty({ description: 'Agent ID' })
  agentId: string;

  @ApiProperty({ description: 'Agent名称' })
  name: string;

  @ApiProperty({ description: 'Agent类型' })
  type: string;
}
