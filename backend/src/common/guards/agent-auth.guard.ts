import { Injectable, UnauthorizedException, ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AgentsService } from '../../modules/agents/agents.service';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private agentsService: AgentsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少或无效的认证Token');
    }

    const token = authorization.substring(7); // 移除 'Bearer ' 前缀

    // 验证Token格式
    if (!token.startsWith('at_')) {
      throw new UnauthorizedException('Token格式无效');
    }

    // 验证Token有效性（调用service方法）
    const agent = await this.agentsService.validateToken(token);
    if (!agent) {
      throw new UnauthorizedException('Token无效或已过期');
    }

    // 将Agent信息附加到request
    request.agent = agent;

    return true;
  }
}
