import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { AgentType } from '../entities/agent.entity';

export class CreateAgentDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(AgentType)
  type: AgentType;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxConcurrentTasks?: number;
}
