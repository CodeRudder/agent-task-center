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

  @ManyToOne(() => Comment, (comment) => comment.histories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

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
