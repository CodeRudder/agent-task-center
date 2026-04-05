import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';
import { ApiUsageLog } from '../entities/api-usage-log.entity';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(ApiUsageLog)
    private apiUsageLogRepository: Repository<ApiUsageLog>,
  ) {}

  async create(createApiKeyDto: CreateApiKeyDto, userId: string) {
    try {
      const apiKey = this.generateApiKey();
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyPrefix = apiKey.substring(0, 8);

      // Handle both scopes and permissions fields for compatibility
      const permissions = createApiKeyDto.scopes || createApiKeyDto.permissions || [];

      const newApiKey = this.apiKeyRepository.create({
        ...createApiKeyDto,
        keyHash,
        keyPrefix,
        permissions,
        createdBy: userId,
        expiresAt: createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null,
      });

      const saved = await this.apiKeyRepository.save(newApiKey) as ApiKey;

      return {
        id: saved.id,
        name: saved.name,
        apiKey: apiKey, // Changed from 'key' to 'apiKey' to match test expectations
        keyPrefix: saved.keyPrefix,
        permissions: saved.permissions,
        isActive: saved.isActive,
        expiresAt: saved.expiresAt,
        createdAt: saved.createdAt,
      };
    } catch (error) {
      // Check if error is related to missing table
      if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('API Keys table does not exist. Please run database migrations.');
      }
      throw error;
    }
  }

  async findAll(isActive?: boolean) {
    try {
      const where = isActive !== undefined ? { isActive } : {};
      const [data, total] = await this.apiKeyRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
      });

      return { data, total };
    } catch (error) {
      // Check if error is related to missing table
      if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new Error('API Keys table does not exist. Please run database migrations.');
      }
      throw error;
    }
  }

  async remove(id: string, userId?: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    // Check if user has permission to delete (only creator can delete)
    if (userId && apiKey.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this API Key');
    }

    await this.apiKeyRepository.remove(apiKey);

    return {
      success: true,
      message: 'API密钥删除成功'
    };
  }

  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const validKey = await this.apiKeyRepository.findOne({
      where: { keyHash, isActive: true },
    });

    if (validKey) {
      // Check if expired
      if (validKey.expiresAt && new Date() > validKey.expiresAt) {
        return null;
      }
      // Update last used at
      await this.apiKeyRepository.update(validKey.id, { lastUsedAt: new Date() });
    }

    return validKey;
  }

  async logUsage(apiKeyId: string, endpoint: string, method: string, statusCode: number, responseTime?: number, ipAddress?: string, userAgent?: string) {
    const log = this.apiUsageLogRepository.create({
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
    });

    await this.apiUsageLogRepository.save(log);
  }

  private generateApiKey(): string {
    const prefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }
}