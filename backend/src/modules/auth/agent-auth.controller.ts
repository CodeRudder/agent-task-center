import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTokenGuard } from './guards/api-token.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Agent Authentication')
@Controller('auth/agent')
export class AgentAuthController {
  @Post('token')
  @ApiOperation({ summary: 'Exchange API token for JWT' })
  @ApiResponse({ status: 201, description: 'JWT token generated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid API token' })
  @UseGuards(ApiTokenGuard)
  async exchangeToken(@Request() req: any) {
    return {
      success: true,
      data: {
        accessToken: req.jwtToken,
        tokenType: 'Bearer',
        expiresIn: 7200, // 2小时
        agent: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
      },
      message: 'JWT token generated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify current authentication' })
  @UseGuards(ApiTokenGuard)
  async verifyAuth(@Request() req: any) {
    return {
      success: true,
      data: {
        agent: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
