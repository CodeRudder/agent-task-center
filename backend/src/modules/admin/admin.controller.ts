import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from '../agents/agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryAgentDto } from '../agents/dto/agent.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('agents')
  @ApiOperation({ summary: 'Get all agents (admin compatibility endpoint)' })
  async getAgents(@Query() query: QueryAgentDto) {
    const result = await this.agentsService.findAll(query);
    
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
