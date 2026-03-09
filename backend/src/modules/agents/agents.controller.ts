import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAgentDto, UpdateAgentDto, QueryAgentDto } from './dto/agent.dto';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async findAll(@Query() query: QueryAgentDto) {
    const result = await this.agentsService.findAll(query);
    
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const agent = await this.agentsService.findOne(id);
    
    return {
      success: true,
      data: agent,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAgentDto: CreateAgentDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    const agent = await this.agentsService.create(createAgentDto, userId);
    
    return {
      success: true,
      data: agent,
      message: 'Agent created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    const agent = await this.agentsService.update(id, updateAgentDto);
    
    return {
      success: true,
      data: agent,
      message: 'Agent updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
