import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { Task } from '../../task/entities/task.entity';
import { Comment } from '../../comment/entities/comment.entity';

export enum NotificationType {
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_UPDATED = 'task_updated',
  SYSTEM_MESSAGE = 'system_message',
  AGENT_MESSAGE = 'agent_message',
  COMMENT_ADDED = 'comment_added',
  COMMENT_MENTION = 'comment_mention',  // @提及通知
  COMMENT_REPLY = 'comment_reply',      // 评论回复通知
}

@Entity('notifications')
@Index(['recipientId', 'isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'sender_id', nullable: true })
  senderId: string | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'notifications_type_enum',
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'related_task_id', nullable: true })
  relatedTaskId: string | null;

  @Column({ name: 'related_comment_id', nullable: true })
  relatedCommentId: string | null;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', nullable: true, type: 'timestamp' })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;

  // Relationships
  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'recipient_id' })
  recipient: Agent;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'sender_id' })
  sender: Agent | null;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'related_task_id' })
  relatedTask: Task | null;

  @ManyToOne(() => Comment)
  @JoinColumn({ name: 'related_comment_id' })
  relatedComment: Comment | null;
}
