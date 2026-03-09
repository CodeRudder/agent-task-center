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
export class AdminRegenerateTokenController {
  private readonly logger = new Logger(AdminRegenerateTokenController.name);

  constructor(
    private readonly apiTokenService: ApiTokenService,
    private readonly agentsService: AgentsService,
  ) {}

  @Post('regenerate-token')
  @HttpCode(HttpStatus.OK)
  async regenerateToken(@Param('id') id: string) {
    this.logger.log(`Regenerating API token for agent ${id}`);

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

      // Regenerate token
      const apiToken = await this.apiTokenService.regenerateApiToken(id);

      this.logger.log(`Successfully regenerated API token for agent ${id}`);

      // Return the new token (only show once in response)
      return {
        success: true,
        data: {
          agentId: id,
          apiToken: apiToken,
          tokenCreatedAt: new Date().toISOString(),
        },
        message: 'API token regenerated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to regenerate API token for agent ${id}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to regenerate API token',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
