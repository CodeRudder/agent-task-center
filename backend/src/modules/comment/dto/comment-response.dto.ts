import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'john_doe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatar?: string;
}

export class CommentMentionDto {
  @ApiProperty({ example: 'mention-uuid-123' })
  @Expose()
  id: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  @Type(() => UserDto)
  mentionedUser: UserDto;

  @ApiProperty({ example: '2026-03-26T12:00:00Z' })
  @Expose()
  createdAt: Date;
}

export class CommentHistoryDto {
  @ApiProperty({ example: 'history-uuid-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Previous comment content' })
  @Expose()
  content: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  @Type(() => UserDto)
  editor: UserDto;

  @ApiProperty({ example: '2026-03-26T12:00:00Z' })
  @Expose()
  editedAt: Date;
}

export class CommentResponseDto {
  @ApiProperty({ example: 'comment-uuid-123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'task-uuid-123' })
  @Expose()
  taskId: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  @Type(() => UserDto)
  author: UserDto;

  @ApiProperty({ example: 'This is a comment' })
  @Expose()
  content: string;

  @ApiProperty({ example: false })
  @Expose()
  isEdited: boolean;

  @ApiPropertyOptional({ example: 'parent-comment-uuid-123' })
  @Expose()
  parentId?: string;

  @ApiPropertyOptional({ type: [CommentResponseDto] })
  @Expose()
  @Type(() => CommentResponseDto)
  replies?: CommentResponseDto[];

  @ApiPropertyOptional({ type: [CommentMentionDto] })
  @Expose()
  @Type(() => CommentMentionDto)
  mentions?: CommentMentionDto[];

  @ApiPropertyOptional({ type: [CommentHistoryDto] })
  @Expose()
  @Type(() => CommentHistoryDto)
  histories?: CommentHistoryDto[];

  @ApiProperty({ example: '2026-03-26T12:00:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-03-26T12:00:00Z' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2026-03-26T12:00:00Z' })
  @Expose()
  deletedAt?: Date;
}

export class CommentListResponseDto {
  @ApiProperty({ example: 100 })
  @Expose()
  total: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 20 })
  @Expose()
  pageSize: number;

  @ApiProperty({ type: [CommentResponseDto] })
  @Expose()
  @Type(() => CommentResponseDto)
  comments: CommentResponseDto[];
}
