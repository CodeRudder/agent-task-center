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

@Controller('auth/agent')
export class VerifyController {
  private readonly logger = new Logger(VerifyController.name);

  constructor(
    private readonly apiTokenService: ApiTokenService,
    private readonly agentsService: AgentsService,
  ) {}

  @Get('verify')
  async verify(@Headers('authorization') authHeader: string) {
    this.logger.log('Verifying API token');

    try {
      // Extract token from Authorization header
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Invalid or missing Authorization header');
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid or missing Authorization header',
          error: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

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
