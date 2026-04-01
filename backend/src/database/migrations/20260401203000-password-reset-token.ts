import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordResetToken20260401203000 implements MigrationInterface {
  name = 'PasswordResetToken20260401203000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pr_t_email_token 
      ON password_reset_tokens(email, token);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pr_t_email_expiresat_isused 
      ON password_reset_tokens(email, expires_at, is_used);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens CASCADE;`);
  }
}