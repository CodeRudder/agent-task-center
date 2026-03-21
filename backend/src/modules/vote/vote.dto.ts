import { IsEnum, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoteType } from './vote.entity';

export class CreateVoteDto {
  @ApiProperty({ 
    description: 'Vote type', 
    enum: VoteType,
    example: VoteType.UPVOTE,
  })
  @IsEnum(VoteType)
  voteType: VoteType;
}

export class UpdateVoteDto {
  @ApiPropertyOptional({ 
    description: 'Vote type', 
    enum: VoteType,
    example: VoteType.UPVOTE,
  })
  @IsOptional()
  @IsEnum(VoteType)
  voteType?: VoteType;
}

export class VoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: VoteType })
  voteType: VoteType;

  @ApiProperty()
  votedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class VoteStatsDto {
  @ApiProperty()
  taskId: string;

  @ApiProperty()
  upvotes: number;

  @ApiProperty()
  downvotes: number;

  @ApiProperty()
  totalVotes: number;

  @ApiProperty()
  score: number; // upvotes - downvotes
}
