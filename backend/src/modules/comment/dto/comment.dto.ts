import { IsString, IsUUID, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'This task needs more details', minLength: 1, maxLength: 500 })
  @IsString()
  @Length(1, 500, { message: 'Comment content must be between 1 and 500 characters' })
  content: string;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(1, 500, { message: 'Comment content must be between 1 and 500 characters' })
  content?: string;
}
