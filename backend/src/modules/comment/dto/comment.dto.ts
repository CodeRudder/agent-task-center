import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
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

export class CreateCommentDto {
  @ApiProperty({ example: 'Completed code implementation, please review' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'task-uuid' })
  @IsUUID()
  taskId: string;

  @ApiPropertyOptional({ type: [MentionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions?: MentionDto[];
}

export class QueryCommentsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  pageSize?: number;
}
