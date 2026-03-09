import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1709739200000 implements MigrationInterface {
  name = 'CreateUsersTable1709739200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar_url VARCHAR(500),
        role VARCHAR(50) DEFAULT 'user',
        feishu_open_id VARCHAR(255) UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_users_feishu_open_id ON users(feishu_open_id);
      CREATE INDEX idx_users_is_active ON users(is_active);
      CREATE INDEX idx_users_deleted_at ON users(deleted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
