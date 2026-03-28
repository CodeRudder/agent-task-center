import { MigrationInterface, QueryRunner } from 'typeorm';

export class V54CreateProjectsTable1711512000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建projects表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE INDEX idx_projects_owner_id ON projects(owner_id);
      CREATE INDEX idx_projects_created_at ON projects(created_at);
      CREATE INDEX idx_projects_updated_at ON projects(updated_at);
      CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
    `);

    // 2. 创建project_member_role_enum枚举类型
    await queryRunner.query(`
      CREATE TYPE project_member_role_enum AS ENUM ('owner', 'admin', 'member');
    `);

    // 3. 创建project_members表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        user_id UUID NOT NULL,
        role project_member_role_enum DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_project_members_project_id ON project_members(project_id);
      CREATE INDEX idx_project_members_user_id ON project_members(user_id);
      CREATE UNIQUE INDEX idx_project_members_unique ON project_members(project_id, user_id);
    `);

    console.log('✅ V5.4项目表创建成功');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：删除project_members表
    await queryRunner.query(`DROP TABLE IF EXISTS project_members`);
    
    // 回滚：删除project_member_role_enum枚举类型
    await queryRunner.query(`DROP TYPE IF EXISTS project_member_role_enum`);
    
    // 回滚：删除projects表
    await queryRunner.query(`DROP TABLE IF EXISTS projects`);

    console.log('✅ V5.4项目表回滚成功');
  }
}
