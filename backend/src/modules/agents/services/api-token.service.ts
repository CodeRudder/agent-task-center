import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export interface ApiTokenPayload {
  agentId: string;
  agentName: string;
  role: string;
}

@Injectable()
export class ApiTokenService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  /**
   * 生成API Token
   * 格式: agt_<agent_id>_<random_string>
   */
  async generateApiToken(agentId: string): Promise<string> {
    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new Error('Agent not found');
    }

    // 生成随机字符串（32字节 = 64个十六进制字符）
    const randomString = randomBytes(32).toString('hex');

    // 生成Token: agt_<agent_id>_<random>
    const apiToken = `agt_${agentId.replace(/-/g, '')}_${randomString}`;

    // 生成Hash（bcrypt）
    // const salt = await bcrypt.genSalt(10);
    // const apiTokenHash = await bcrypt.hash(apiToken, salt);

    // 更新Agent记录
    agent.apiToken = apiToken;
    // agent.apiTokenHash = apiTokenHash;
    // agent.apiTokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年有效期

    await this.agentRepository.save(agent);

    return apiToken;
  }

  /**
   * 验证API Token
   */
  async validateApiToken(apiToken: string): Promise<ApiTokenPayload | null> {
    if (!apiToken || !apiToken.startsWith('agt_')) {
      return null;
    }

    // 查找Agent（通过api_token快速查找）
    const agent = await this.agentRepository.findOne({
      where: { apiToken },
    });

    if (!agent) {
      return null;
    }

    // 验证Hash
    // const isValid = await bcrypt.compare(apiToken, agent.apiTokenHash);
    // if (!isValid) {
    //   return null;
    // }

    // 检查过期时间
    // if (agent.apiTokenExpiresAt && agent.apiTokenExpiresAt < new Date()) {
    //   return null;
    // }

    // 更新最后访问时间
    // agent.lastApiAccessAt = new Date();
    // await this.agentRepository.save(agent);

    return {
      agentId: agent.id,
      agentName: agent.name,
      role: agent.type, // 使用type代替role
    };
  }

  /**
   * 撤销API Token
   */
  async revokeApiToken(agentId: string): Promise<void> {
    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new Error('Agent not found');
    }

    agent.apiToken = null;
    // agent.apiTokenHash = null;
    // agent.apiTokenExpiresAt = null;

    await this.agentRepository.save(agent);
  }

  /**
   * 重新生成API Token
   */
  async regenerateApiToken(agentId: string): Promise<string> {
    await this.revokeApiToken(agentId);
    return this.generateApiToken(agentId);
  }
}
