import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MentionDto {
  @ApiProperty({ example: 'claw2-qa' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: { start: 0, end: 10 } })
  @IsOptional()
  position?: {
    start: number;
    end: number;
  };
}

export class CreateAgentCommentDto {
  @ApiProperty({ example: 'Completed code implementation, please review' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [MentionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions?: MentionDto[];
}

export class QueryAgentCommentsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  pageSize?: number;
}
