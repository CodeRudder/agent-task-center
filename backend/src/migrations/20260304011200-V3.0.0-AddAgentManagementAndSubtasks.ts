import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddAgentManagementAndSubtasks1709481600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 扩展agents表 - 添加档案管理字段
    await queryRunner.query(`
      ALTER TABLE agents 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS api_token VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
    `);

    // 2. 为现有Agent生成API Token（数据迁移）
    await queryRunner.query(`
      UPDATE agents 
      SET api_token = 'at_' || encode(md5(random()::text), 'hex')
      WHERE api_token IS NULL AND deleted_at IS NULL;
    `);

    // 3. 添加agents表索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agents_api_token ON agents(api_token) 
        WHERE deleted_at IS NULL;
    `);

    // 4. 扩展tasks表 - 添加子任务支持字段
    await queryRunner.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 5),
      ADD COLUMN IF NOT EXISTS path VARCHAR(1000),
      ADD COLUMN IF NOT EXISTS is_leaf BOOLEAN DEFAULT true;
    `);

    // 5. 更新现有任务的path和level
    await queryRunner.query(`
      UPDATE tasks
      SET 
        path = '/' || CAST(id AS TEXT),
        level = 1,
        is_leaf = true
      WHERE parent_id IS NULL AND deleted_at IS NULL;
    `);

    // 6. 添加tasks表索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
      CREATE INDEX IF NOT EXISTS idx_tasks_path ON tasks(path);
    `);

    // 7. 创建agent_stats表
    // 先删除旧表（如果存在）
    await queryRunner.query(`DROP TABLE IF EXISTS agent_stats CASCADE`);
    
    await queryRunner.createTable(
      new Table({
        name: 'agent_stats',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agent_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'total_tasks',
            type: 'integer',
            default: 0,
          },
          {
            name: 'completed_tasks',
            type: 'integer',
            default: 0,
          },
          {
            name: 'accepted_tasks',
            type: 'integer',
            default: 0,
          },
          {
            name: 'rejected_tasks',
            type: 'integer',
            default: 0,
          },
          {
            name: 'avg_completion_time_hours',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'on_time_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'period_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'period_start',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['agent_id'],
            referencedTableName: 'agents',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        uniques: [
          {
            columnNames: ['agent_id', 'period_type', 'period_start'],
          },
        ],
        checks: [
          {
            columnNames: ['period_type'],
            expression: `period_type IN ('day', 'week', 'month', 'all_time')`,
          },
        ],
      }),
      true,
    );

    // 8. 添加agent_stats表索引
    await queryRunner.query(`
      CREATE INDEX idx_agent_stats_agent ON agent_stats(agent_id);
      CREATE INDEX idx_agent_stats_period ON agent_stats(period_type, period_start);
      CREATE INDEX idx_agent_stats_calculated ON agent_stats(calculated_at DESC);
    `);

    // 9. 创建task_dependencies表
    await queryRunner.createTable(
      new Table({
        name: 'task_dependencies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'task_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'depends_on_task_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'dependency_type',
            type: 'varchar',
            length: '20',
            default: "'finish_to_start'",
          },
          {
            name: 'lag_hours',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['task_id'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['depends_on_task_id'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          },
        ],
        uniques: [
          {
            columnNames: ['task_id', 'depends_on_task_id'],
          },
        ],
        checks: [
          {
            columnNames: ['dependency_type'],
            expression: `dependency_type IN ('finish_to_start', 'start_to_start', 'start_to_finish', 'finish_to_finish')`,
          },
          {
            columnNames: ['task_id', 'depends_on_task_id'],
            expression: `task_id != depends_on_task_id`,
          },
        ],
      }),
      true,
    );

    // 10. 添加task_dependencies表索引
    await queryRunner.query(`
      CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
      CREATE INDEX idx_task_deps_depends_on ON task_dependencies(depends_on_task_id);
      CREATE INDEX idx_task_deps_type ON task_dependencies(dependency_type);
    `);

    // 11. 创建触发器函数：update_task_path
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_task_path()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.parent_id IS NULL THEN
          NEW.path := '/' || NEW.id::TEXT;
          NEW.level := 1;
        ELSE
          SELECT path || '/' || NEW.id::TEXT, level + 1
          INTO NEW.path, NEW.level
          FROM tasks
          WHERE id = NEW.parent_id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 12. 创建触发器：trigger_update_task_path
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_task_path ON tasks;
      CREATE TRIGGER trigger_update_task_path
      BEFORE INSERT ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_task_path();
    `);

    // 13. 创建触发器函数：update_task_leaf_status
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_task_leaf_status()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          -- 新增子任务时，将父任务标记为非叶子节点
          IF NEW.parent_id IS NOT NULL THEN
            UPDATE tasks SET is_leaf = false WHERE id = NEW.parent_id;
          END IF;
        ELSIF TG_OP = 'DELETE' THEN
          -- 删除子任务时，检查父任务是否还有其他子任务
          IF OLD.parent_id IS NOT NULL THEN
            UPDATE tasks 
            SET is_leaf = (
              SELECT NOT EXISTS(
                SELECT 1 FROM tasks WHERE parent_id = OLD.parent_id AND deleted_at IS NULL
              )
            )
            WHERE id = OLD.parent_id;
          END IF;
        END IF;
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 14. 创建触发器：trigger_update_task_leaf_status
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_task_leaf_status ON tasks;
      CREATE TRIGGER trigger_update_task_leaf_status
      AFTER INSERT OR DELETE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_task_leaf_status();
    `);

    // 15. 创建物化视图：task_stats_view
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS task_stats_view AS
      SELECT 
        -- 时间维度
        DATE(created_at) as date,
        
        -- 基础统计
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_tasks,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_tasks,
        
        -- 延期统计
        COUNT(*) FILTER (
          WHERE status NOT IN ('accepted', 'rejected') 
            AND deadline < NOW()
        ) as overdue_tasks,
        
        -- 优先级分布
        COUNT(*) FILTER (WHERE priority = 'low') as low_priority_tasks,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority_tasks,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tasks,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_priority_tasks,
        
        -- 完成率
        ROUND(
          COUNT(*) FILTER (WHERE status IN ('completed', 'accepted'))::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100, 
          2
        ) as completion_rate,
        
        -- 平均完成时间（天）
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (completed_at - started_at)) / 86400
          ) FILTER (WHERE status IN ('completed', 'accepted'))::DECIMAL,
          2
        ) as avg_completion_days
      FROM tasks
      WHERE deleted_at IS NULL
        AND parent_id IS NULL  -- 只统计根任务
      GROUP BY DATE(created_at);
    `);

    // 16. 创建物化视图索引
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_task_stats_view_date ON task_stats_view(date);
      CREATE INDEX IF NOT EXISTS idx_task_stats_view_date_desc ON task_stats_view(date DESC);
    `);

    // 17. 添加表和字段注释
    await queryRunner.query(`
      -- agents表注释
      COMMENT ON COLUMN agents.description IS 'Agent描述（能力说明）';
      COMMENT ON COLUMN agents.api_token IS 'API认证Token（长期有效）';
      COMMENT ON COLUMN agents.metadata IS '扩展元数据（动态属性）';
      
      -- agent_stats表注释
      COMMENT ON TABLE agent_stats IS 'Agent统计表（支持多时间周期）';
      COMMENT ON COLUMN agent_stats.period_type IS '统计周期：day-日, week-周, month-月, all_time-全部';
      COMMENT ON COLUMN agent_stats.on_time_rate IS '按时完成率（0-100）';
      COMMENT ON COLUMN agent_stats.avg_completion_time_hours IS '平均完成时间（小时）';
      
      -- tasks表注释
      COMMENT ON COLUMN tasks.parent_id IS '父任务ID（NULL表示根任务）';
      COMMENT ON COLUMN tasks.level IS '任务层级（1-5级）';
      COMMENT ON COLUMN tasks.path IS '任务路径（如：/uuid1/uuid2/uuid3）';
      COMMENT ON COLUMN tasks.is_leaf IS '是否叶子节点（无子任务）';
      
      -- task_dependencies表注释
      COMMENT ON TABLE task_dependencies IS '任务依赖关系表';
      COMMENT ON COLUMN task_dependencies.dependency_type IS '依赖类型：finish_to_start-完成-开始（默认），start_to_start-开始-开始，start_to_finish-开始-完成，finish_to_finish-完成-完成';
      COMMENT ON COLUMN task_dependencies.lag_hours IS '延迟时间（小时）';
      
      -- task_stats_view注释
      COMMENT ON MATERIALIZED VIEW task_stats_view IS '任务统计物化视图（按日统计）';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚顺序：先删除依赖对象，再删除基础对象
    
    // 1. 删除物化视图
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS task_stats_view;`);

    // 2. 删除触发器
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_task_leaf_status ON tasks;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_task_path ON tasks;`);

    // 3. 删除触发器函数
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_task_leaf_status();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_task_path();`);

    // 4. 删除task_dependencies表
    await queryRunner.dropTable('task_dependencies', true, true, true);

    // 5. 删除agent_stats表
    await queryRunner.dropTable('agent_stats', true, true, true);

    // 6. 删除tasks表扩展字段的索引
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_path;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_level;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_parent;`);

    // 7. 删除tasks表扩展字段
    await queryRunner.query(`
      ALTER TABLE tasks
      DROP COLUMN IF EXISTS is_leaf,
      DROP COLUMN IF EXISTS path,
      DROP COLUMN IF EXISTS level,
      DROP COLUMN IF EXISTS parent_id;
    `);

    // 8. 删除agents表扩展字段的索引
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agents_api_token;`);

    // 9. 删除agents表扩展字段
    await queryRunner.query(`
      ALTER TABLE agents
      DROP COLUMN IF EXISTS created_by,
      DROP COLUMN IF EXISTS metadata,
      DROP COLUMN IF EXISTS api_token,
      DROP COLUMN IF EXISTS description;
    `);
  }
}
