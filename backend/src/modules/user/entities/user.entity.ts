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
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

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
