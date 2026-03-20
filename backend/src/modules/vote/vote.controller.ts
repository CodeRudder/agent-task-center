import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { VoteService } from './vote.service';
import { CreateVoteDto, VoteStatsDto, VoteResponseDto } from './vote.dto';

@ApiTags('votes')
@ApiBearerAuth()
@Controller('tasks/:id/votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post()
  @ApiOperation({ summary: 'Vote on a task' })
  @ApiParam({ name: 'id', description: 'Task ID', type: 'string' })
  async vote(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() createVoteDto: CreateVoteDto,
    @Request() req: any,
  ): Promise<VoteResponseDto> {
    return this.voteService.vote(id, req.user.id, createVoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get vote statistics for a task' })
  @ApiParam({ name: 'id', description: 'Task ID', type: 'string' })
  async getVoteStats(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VoteStatsDto> {
    return this.voteService.getVoteStats(id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user vote for a task' })
  @ApiParam({ name: 'id', description: 'Task ID', type: 'string' })
  async getUserVote(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: any,
  ): Promise<VoteResponseDto | null> {
    return this.voteService.getUserVote(id, req.user.id);
  }
}
