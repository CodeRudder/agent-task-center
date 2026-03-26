import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../../user/entities/user.entity';

@Entity('comment_mentions')
@Unique(['commentId', 'mentionedUserId'])
@Index(['commentId'])
@Index(['mentionedUserId'])
export class CommentMention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comment_id' })
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.mentions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ name: 'mentioned_user_id' })
  mentionedUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentioned_user_id' })
  mentionedUser: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
