import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  QueryAgentDto,
  AgentResponseDto,
  AgentListResponseDto,
} from './dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

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
}
