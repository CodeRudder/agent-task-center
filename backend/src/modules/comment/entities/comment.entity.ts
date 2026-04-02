import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

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

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // task: Task;

  @Column({ name: 'author_id' })
  authorId: string;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // author: User;

  @Column({ type: 'text' })
  content: string;

  // 新增字段：标记评论是否被编辑
  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited: boolean;

  // 新增字段：父评论ID（支持评论回复）
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // parent: Comment;

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // replies: Comment[];

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // mentions: CommentMention[];

  // ADR-002: 移除关联装饰器，使用显式JOIN查询
  // histories: CommentHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;
}
