import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiTokenService } from '../../agents/services/api-token.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(
    private readonly apiTokenService: ApiTokenService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // 判断Token类型
    if (token.startsWith('agt_')) {
      // API Token认证
      const payload = await this.apiTokenService.validateApiToken(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid API token');
      }

      // 生成短期JWT
      const jwtToken = this.jwtService.sign({
        sub: `agent:${payload.agentId}`,
        type: 'agent_access',
        role: payload.role,
        agentName: payload.agentName,
      });

      // 注入Agent信息和JWT
      request.user = {
        id: payload.agentId,
        name: payload.agentName,
        role: payload.role,
      };
      request.jwtToken = jwtToken;

      return true;
    } else {
      // JWT认证
      try {
        const payload = this.jwtService.verify(token);
        request.user = {
          id: payload.sub.replace('agent:', ''),
          name: payload.agentName,
          role: payload.role,
        };
        return true;
      } catch (error) {
        throw new UnauthorizedException('Invalid JWT token');
      }
    }
  }
}
