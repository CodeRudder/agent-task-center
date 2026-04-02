import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../../user/entities/user.entity';

@Entity('comment_histories')
@Index(['commentId'])
@Index(['editedBy'])
@Index(['editedAt'])
export class CommentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comment_id' })
  commentId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // comment: Comment;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'edited_by' })
  editedBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edited_by' })
  editor: User;

  @CreateDateColumn({ name: 'edited_at', type: 'timestamp' })
  editedAt: Date;
}
