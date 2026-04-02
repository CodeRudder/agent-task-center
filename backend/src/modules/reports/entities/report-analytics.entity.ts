import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('report_analytics')
@Index(['reportType'])
@Index(['expiresAt'])
export class ReportAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_type', type: 'varchar', length: 100 })
  reportType: string;

  @Column({ type: 'jsonb', default: '{}' })
  filters: Record<string, any>;

  @Column({ type: 'jsonb' })
  result: Record<string, any>;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
