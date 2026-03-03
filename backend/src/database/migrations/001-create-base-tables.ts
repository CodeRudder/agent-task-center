import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBaseTables1709424000001 implements MigrationInterface {
  name = 'CreateBaseTables1709424000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建categories表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        parent_id UUID REFERENCES categories(id),
        level INTEGER DEFAULT 1,
        path VARCHAR(500),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_categories_parent_id ON categories(parent_id);
      CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);
    `);

    // 2. 创建tags表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL UNIQUE,
        color VARCHAR(20) DEFAULT '#1890ff',
        created_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_tags_deleted_at ON tags(deleted_at);
    `);

    // 3. 创建agents表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'offline'
          CHECK (status IN ('online', 'offline', 'busy')),
        capabilities JSONB DEFAULT '[]',
        max_concurrent_tasks INTEGER DEFAULT 5,
        api_token VARCHAR(255) UNIQUE,
        avatar VARCHAR(500),
        last_heartbeat_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_agents_status ON agents(status);
      CREATE INDEX idx_agents_type ON agents(type);
      CREATE INDEX idx_agents_deleted_at ON agents(deleted_at);
      CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);
    `);

    // 4. 创建audit_logs表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_type VARCHAR(20) NOT NULL CHECK (operator_type IN ('user', 'agent', 'system')),
        operator_id UUID,
        operation VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_audit_logs_operator ON audit_logs(operator_type, operator_id);
      CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    `);

    // 5. 插入初始数据
    await queryRunner.query(`
      -- 插入分类数据
      INSERT INTO categories (name, level, sort_order) VALUES
        ('开发', 1, 1),
        ('测试', 1, 2),
        ('设计', 1, 3);

      -- 插入标签数据
      INSERT INTO tags (name, color) VALUES
        ('紧急', '#f5222d'),
        ('重要', '#fa8c16'),
        ('优化', '#52c41a'),
        ('Bug', '#eb2f96');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS agents`);
    await queryRunner.query(`DROP TABLE IF EXISTS tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
  }
}
