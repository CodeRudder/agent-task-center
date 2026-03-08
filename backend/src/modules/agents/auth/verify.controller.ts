import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTokenService } from '../services/api-token.service';
import { AgentsService } from '../agents.service';

@Controller('agent/auth')
export class VerifyController {
  private readonly logger = new Logger(VerifyController.name);

  constructor(
    private readonly apiTokenService: ApiTokenService,
    private readonly agentsService: AgentsService,
  ) {}

  @Get('verify')
  async verify(@Headers('x-agent-token') agentToken: string) {
    this.logger.log('Verifying API token');

    try {
      // Extract token from X-Agent-Token header
      if (!agentToken) {
        this.logger.warn('Missing X-Agent-Token header');
        throw new UnauthorizedException({
          success: false,
          message: 'Missing X-Agent-Token header',
          error: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
      }

      const token = agentToken;

      // Validate token
      const payload = await this.apiTokenService.validateApiToken(token);
      if (!payload) {
        this.logger.warn('Invalid or expired API token');
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid or expired API token',
          error: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
      }

      // Get agent details
      const agent = await this.agentsService.findOne(payload.agentId);

      this.logger.log(`Successfully verified API token for agent ${payload.agentId}`);

      return {
        success: true,
        data: {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          role: agent.role,
          type: agent.type,
        },
        message: 'Token verified successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Failed to verify API token', error.stack);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to verify API token',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
