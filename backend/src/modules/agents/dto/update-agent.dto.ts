import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentDto } from './create-agent.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AgentStatus } from '../entities/agent.entity';

export class UpdateAgentDto extends PartialType(CreateAgentDto) {
  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;
}
