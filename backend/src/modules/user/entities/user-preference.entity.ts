import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
@Index('idx_user_preferences_user_id', ['userId'])
export class UserPreference {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ default: 'light' })
  theme: string;

  @Column({ default: 'zh-CN' })
  language: string;

  @Column({ type: 'jsonb', default: { email: true, browser: true } })
  notifications: Record<string, any>;

  @Column({ type: 'jsonb', default: { default_view: 'list' } })
  dashboard: Record<string, any>;

  @OneToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
