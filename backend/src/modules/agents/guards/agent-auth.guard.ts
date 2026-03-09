import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTokenService } from '../services/api-token.service';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  private readonly logger = new Logger(AgentAuthGuard.name);

  constructor(private readonly apiTokenService: ApiTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization header');
      throw new UnauthorizedException({
        success: false,
        message: 'Missing or invalid Authorization header',
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

    // Attach agent info to request
    request.agent = payload;

    this.logger.log(`Agent ${payload.agentId} authenticated successfully`);

    return true;
  }
}
