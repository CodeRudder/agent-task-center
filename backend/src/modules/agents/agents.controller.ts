import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { ApiTokenService } from './services/api-token.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  QueryAgentDto,
  AgentResponseDto,
  AgentListResponseDto,
} from './dto';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly apiTokenService: ApiTokenService,
  ) {}

  @Get()
  async findAll(
    @Query() query: QueryAgentDto,
  ): Promise<{ success: boolean; data: AgentListResponseDto; timestamp: string }> {
    const result = await this.agentsService.findAll(query);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: AgentResponseDto; timestamp: string }> {
    const result = await this.agentsService.findOne(id);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(
    @Body() createAgentDto: CreateAgentDto,
  ): Promise<{ success: boolean; data: AgentResponseDto; timestamp: string }> {
    const result = await this.agentsService.create(createAgentDto);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ): Promise<{ success: boolean; data: AgentResponseDto; timestamp: string }> {
    const result = await this.agentsService.update(id, updateAgentDto);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // V5: API Token管理端点

  @Post(':id/api-token')
  async generateApiToken(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    success: boolean;
    data: { apiToken: string; expiresAt: string };
    message: string;
    timestamp: string;
  }> {
    const apiToken = await this.apiTokenService.generateApiToken(id);
    const agent = await this.agentsService.findOne(id);
    
    return {
      success: true,
      data: {
        apiToken,
        expiresAt: agent.apiTokenExpiresAt.toISOString(),
      },
      message: 'API Token generated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/api-token')
  @HttpCode(HttpStatus.OK)
  async revokeApiToken(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    await this.apiTokenService.revokeApiToken(id);
    
    return {
      success: true,
      message: 'API Token revoked successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/api-token/regenerate')
  async regenerateApiToken(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    success: boolean;
    data: { apiToken: string; expiresAt: string };
    message: string;
    timestamp: string;
  }> {
    const apiToken = await this.apiTokenService.regenerateApiToken(id);
    const agent = await this.agentsService.findOne(id);
    
    return {
      success: true,
      data: {
        apiToken,
        expiresAt: agent.apiTokenExpiresAt.toISOString(),
      },
      message: 'API Token regenerated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
