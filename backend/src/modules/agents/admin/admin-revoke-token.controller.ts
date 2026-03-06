import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTokenService } from '../services/api-token.service';
import { AgentsService } from '../agents.service';

@Controller('admin/:id')
export class AdminRevokeTokenController {
  private readonly logger = new Logger(AdminRevokeTokenController.name);

  constructor(
    private readonly apiTokenService: ApiTokenService,
    private readonly agentsService: AgentsService,
  ) {}

  @Post('revoke-token')
  @HttpCode(HttpStatus.OK)
  async revokeToken(@Param('id') id: string) {
    this.logger.log(`Revoking API token for agent ${id}`);

    try {
      // Check if agent exists
      const agent = await this.agentsService.findOne(id);
      if (!agent) {
        this.logger.warn(`Agent ${id} not found`);
        throw new NotFoundException({
          success: false,
          message: 'Agent not found',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      // Revoke token
      await this.apiTokenService.revokeApiToken(id);

      this.logger.log(`Successfully revoked API token for agent ${id}`);

      return {
        success: true,
        data: {
          agentId: id,
          tokenRevokedAt: new Date().toISOString(),
        },
        message: 'API token revoked successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to revoke API token for agent ${id}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to revoke API token',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
