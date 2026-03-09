import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import * as crypto from 'crypto';

export interface ApiTokenPayload {
  agentId: string;
  agentName: string;
  role: string;
}

@Injectable()
export class ApiTokenService {
  private readonly logger = new Logger(ApiTokenService.name);

  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  /**
   * 生成API Token
   * 格式: at_<32位随机字符串>
   */
  async generateApiToken(agentId: string): Promise<string> {
    this.logger.log(`Generating API token for agent ${agentId}`);

    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      this.logger.warn(`Agent ${agentId} not found`);
      throw new Error('Agent not found');
    }

    // 生成32字节随机字符串（64个十六进制字符）
    const randomString = crypto.randomBytes(32).toString('hex');

    // 生成Token: at_<32位随机字符串>
    const apiToken = `at_${randomString}`;

    // 更新Agent记录
    agent.apiToken = apiToken;
    agent.apiTokenHash = null; // 不再使用hash
    agent.apiTokenExpiresAt = null; // 不使用过期时间
    agent.tokenCreatedAt = new Date(); // 记录token创建时间

    await this.agentRepository.save(agent);

    this.logger.log(`Successfully generated API token for agent ${agentId}`);

    return apiToken;
  }

  /**
   * 验证API Token
   * 支持两种格式（向后兼容）:
   * - at_ (新格式，推荐)
   * - agt_ (旧格式，逐步迁移)
   */
  async validateApiToken(apiToken: string): Promise<ApiTokenPayload | null> {
    // 支持两种Token格式：at_ 和 agt_
    if (!apiToken || !(apiToken.startsWith('at_') || apiToken.startsWith('agt_'))) {
      this.logger.warn(`Invalid token format: ${apiToken ? apiToken.substring(0, 10) : 'null'}...`);
      return null;
    }

    // 查找Agent（通过api_token快速查找）
    const agent = await this.agentRepository.findOne({
      where: { apiToken },
    });

    if (!agent) {
      this.logger.warn(`Token not found in database`);
      return null;
    }

    // 更新最后调用时间（同时更新两个字段以保持兼容）
    const now = new Date();
    agent.lastApiAccessAt = now;
    agent.lastApiCallAt = now;
    await this.agentRepository.save(agent);

    this.logger.log(`Successfully validated API token for agent ${agent.id}`);

    return {
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
    };
  }

  /**
   * 撤销API Token
   */
  async revokeApiToken(agentId: string): Promise<void> {
    this.logger.log(`Revoking API token for agent ${agentId}`);

    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      this.logger.warn(`Agent ${agentId} not found`);
      throw new Error('Agent not found');
    }

    agent.apiToken = null;
    agent.apiTokenHash = null;
    agent.apiTokenExpiresAt = null;
    agent.tokenCreatedAt = null;
    agent.lastApiCallAt = null;

    await this.agentRepository.save(agent);

    this.logger.log(`Successfully revoked API token for agent ${agentId}`);
  }

  /**
   * 重新生成API Token
   */
  async regenerateApiToken(agentId: string): Promise<string> {
    this.logger.log(`Regenerating API token for agent ${agentId}`);
    await this.revokeApiToken(agentId);
    return this.generateApiToken(agentId);
  }
}
