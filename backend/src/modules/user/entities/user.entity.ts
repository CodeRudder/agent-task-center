import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Task } from '../../task/entities/task.entity';

@Entity('users')
@Index(['email'])
@Index(['feishuOpenId'])
@Index(['isActive'])
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;


  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ name: 'feishu_open_id', nullable: true })
  feishuOpenId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // V5.6新增字段
  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'login_count', default: 0 })
  loginCount: number;

  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];

  notifications: any[]; // For type compatibility

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
