import { IsString, IsUUID, IsNotEmpty, IsOptional, IsArray, MaxLength, IsDefined } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'task-uuid-123', description: '任务ID' })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ example: 'This task needs more details', minLength: 1, maxLength: 2000 })
  @IsDefined({ message: '评论内容不能为空' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: '评论内容最多2000个字符' })
  content: string;

  @ApiPropertyOptional({ example: 'parent-comment-uuid-123', description: '父评论ID（支持评论回复）' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ 
    example: ['user-uuid-1', 'user-uuid-2'], 
    description: '被@的用户ID列表',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentions?: string[];

  @ApiPropertyOptional({ 
    example: ['user-uuid-1', 'user-uuid-2'], 
    description: '需要通知的用户ID列表',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  notifyUsers?: string[];
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Updated comment content', minLength: 1, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: '评论内容最多2000个字符' })
  content: string;
}
