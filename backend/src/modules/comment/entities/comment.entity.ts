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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;
}
