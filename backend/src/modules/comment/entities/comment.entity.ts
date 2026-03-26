import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from '../../task/entities/task.entity';
import { User } from '../../user/entities/user.entity';
import { CommentMention } from './comment-mention.entity';
import { CommentHistory } from './comment-history.entity';

@Entity('comments')
@Index(['authorId'])
@Index(['taskId'])
@Index(['createdAt'])
@Index(['parentId'])
@Index(['isEdited'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'text' })
  content: string;

  // 新增字段：标记评论是否被编辑
  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited: boolean;

  // 新增字段：父评论ID（支持评论回复）
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  // 新增关系：父评论
  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  // 新增关系：子评论（回复）
  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  // 新增关系：@提及
  @OneToMany(() => CommentMention, (mention) => mention.comment)
  mentions: CommentMention[];

  // 新增关系：编辑历史
  @OneToMany(() => CommentHistory, (history) => history.comment)
  histories: CommentHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;
}
