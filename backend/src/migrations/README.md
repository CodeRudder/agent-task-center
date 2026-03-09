# V3.0 数据库迁移说明

## 概述

本迁移脚本为V3.0版本添加Agent管理能力和任务协作增强功能，包含以下数据库变更：

### 新增功能
1. **Agent档案管理**
   - 添加 `description`、`api_token`、`metadata`、`created_by` 字段
   - 为现有Agent自动生成API Token

2. **Agent统计表** (`agent_stats`)
   - 支持多时间周期统计（日/周/月/全部）
   - 记录任务完成率、按时率、平均完成时间等指标

3. **子任务支持**
   - 扩展 `tasks` 表，添加 `parent_id`、`level`、`path`、`is_leaf` 字段
   - 支持最多5级子任务嵌套
   - 自动维护任务路径和层级关系

4. **任务依赖关系** (`task_dependencies`)
   - 支持标准的4种依赖类型（FS/SS/SF/FF）
   - 支持延迟时间（lag_hours）
   - 防止循环依赖和自依赖

5. **自动化触发器**
   - `update_task_path()`：自动维护任务路径
   - `update_task_leaf_status()`：自动维护叶子节点状态

6. **物化视图** (`task_stats_view`)
   - 任务统计物化视图，按日统计
   - 支持快速查询仪表盘数据

## 执行前准备

### 1. 备份数据库
```bash
# 使用pg_dump备份当前数据库
pg_dump -h localhost -U admin -d agent_task -F c -f backup_v2.0_$(date +%Y%m%d_%H%M%S).dump

# 或者使用SQL格式备份
pg_dump -h localhost -U admin -d agent_task > backup_v2.0_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 检查数据库连接
确保 `.env` 文件中的数据库配置正确：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=agent_task
```

### 3. 确认TypeORM配置
确认 `src/config/data-source.ts` 配置正确，migrations路径已设置：
```typescript
migrations: ['src/migrations/*{.ts,.js}']
```

### 4. 检查现有数据
```bash
# 连接数据库检查现有数据
psql -h localhost -U admin -d agent_task

# 查看现有表结构
\dt

# 查看agents表数据量
SELECT COUNT(*) FROM agents WHERE deleted_at IS NULL;

# 查看tasks表数据量
SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL;

# 退出
\q
```

## 执行迁移

### 方式1：使用npm脚本（推荐）

```bash
# 进入后端目录
cd /home/gongdewei/.openclaw/workspace-coding/agent-task-system/backend

# 编译TypeScript（如果尚未编译）
npm run build

# 执行迁移
npm run migration:run
```

### 方式2：直接使用TypeORM CLI

```bash
# 进入后端目录
cd /home/gongdewei/.openclaw/workspace-coding/agent-task-system/backend

# 执行迁移
npm run typeorm migration:run -d src/config/data-source.ts
```

### 方式3：手动执行SQL（调试用）

如果需要调试或手动执行，可以从迁移文件中提取SQL语句：

```bash
# 查看迁移文件内容
cat src/migrations/20260304011200-V3.0.0-AddAgentManagementAndSubtasks.ts

# 连接数据库
psql -h localhost -U admin -d agent_task

# 手动执行SQL（从迁移文件中复制）
-- 1. 扩展agents表
ALTER TABLE agents ...

-- 2. 创建新表
CREATE TABLE agent_stats ...

-- 等等
```

## 验证迁移

### 1. 检查表结构

```bash
psql -h localhost -U admin -d agent_task
```

```sql
-- 查看所有表
\dt

-- 检查agents表结构（应该包含新增字段）
\d agents

-- 检查tasks表结构（应该包含子任务相关字段）
\d tasks

-- 检查新创建的agent_stats表
\d agent_stats

-- 检查新创建的task_dependencies表
\d task_dependencies

-- 检查触发器函数
\df+ update_task_path
\df+ update_task_leaf_status

-- 检查触发器
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname IN ('trigger_update_task_path', 'trigger_update_task_leaf_status');

-- 检查物化视图
\dm task_stats_view
```

### 2. 验证数据迁移

```sql
-- 检查Agent API Token是否已生成
SELECT 
  id, 
  name, 
  LEFT(api_token, 20) as token_preview,
  created_at
FROM agents 
WHERE deleted_at IS NULL 
LIMIT 5;

-- 检查现有任务的path和level是否已更新
SELECT 
  id, 
  title, 
  parent_id,
  level,
  path,
  is_leaf
FROM tasks 
WHERE deleted_at IS NULL 
LIMIT 10;

-- 检查物化视图数据
SELECT * FROM task_stats_view ORDER BY date DESC LIMIT 10;
```

### 3. 验证触发器功能

```sql
-- 测试触发器：创建子任务
BEGIN;

-- 1. 创建一个测试父任务
INSERT INTO tasks (id, title, status, priority, created_at, updated_at)
VALUES (
  'test-parent-task-001',
  '测试父任务',
  'pending',
  'medium',
  NOW(),
  NOW()
) RETURNING id, path, level, is_leaf;

-- 2. 创建一个测试子任务（parent_id指向父任务）
INSERT INTO tasks (id, title, status, priority, parent_id, created_at, updated_at)
VALUES (
  'test-subtask-001',
  '测试子任务',
  'pending',
  'medium',
  'test-parent-task-001',
  NOW(),
  NOW()
) RETURNING id, path, level, is_leaf;

-- 3. 检查父任务的is_leaf是否被更新为false
SELECT id, title, is_leaf FROM tasks WHERE id = 'test-parent-task-001';

-- 4. 回滚测试数据
ROLLBACK;

-- 或者提交测试
-- COMMIT;
```

### 4. 验证索引

```sql
-- 检查新创建的索引
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE tablename IN ('agents', 'tasks', 'agent_stats', 'task_dependencies', 'task_stats_view')
ORDER BY tablename, indexname;
```

### 5. 性能测试

```sql
-- 测试查询性能（应该使用索引）
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE parent_id = 'some-uuid';

EXPLAIN ANALYZE
SELECT * FROM agent_stats WHERE agent_id = 'some-uuid';

EXPLAIN ANALYZE
SELECT * FROM task_dependencies WHERE task_id = 'some-uuid';
```

## 回滚迁移

如果迁移出现问题，可以执行回滚：

### 方式1：使用npm脚本

```bash
npm run migration:revert
```

### 方式2：使用TypeORM CLI

```bash
npm run typeorm migration:revert -d src/config/data-source.ts
```

### 方式3：从备份恢复

```bash
# 删除数据库
dropdb -h localhost -U admin agent_task

# 从备份恢复
pg_restore -h localhost -U admin -d agent_task backup_v2.0_YYYYMMDD_HHMMSS.dump

# 或者使用SQL备份
psql -h localhost -U admin -d agent_task < backup_v2.0_YYYYMMDD_HHMMSS.sql
```

## 迁移后配置

### 1. 配置定时刷新物化视图

为了保持统计数据最新，需要配置定时任务刷新物化视图：

#### 方式1：使用pg_cron扩展（推荐）

```sql
-- 安装pg_cron扩展（需要超级用户权限）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 配置每小时刷新物化视图
SELECT cron.schedule('refresh_task_stats', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY task_stats_view');
```

#### 方式2：使用NestJS定时任务

在应用中添加定时任务服务：

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class StatsRefreshService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async refreshTaskStats() {
    await this.dataSource.query(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY task_stats_view'
    );
  }
}
```

### 2. 配置Agent统计更新任务

添加定时任务更新Agent统计数据：

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async updateAgentStats() {
  // 更新Agent统计逻辑
  // 参考：技术方案文档 4.4 节
}
```

## 常见问题

### Q1: 迁移执行失败：permission denied

**解决方案**：确保数据库用户有足够的权限
```sql
GRANT ALL PRIVILEGES ON DATABASE agent_task TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
```

### Q2: 迁移失败：relation "users" does not exist

**原因**：迁移脚本中引用了 `users` 表的外键约束

**解决方案**：确保 `users` 表已存在，或者修改迁移脚本暂时移除 `created_by` 字段的外键约束

### Q3: 物化视图刷新失败：CONCURRENTLY requires a UNIQUE index

**原因**：物化视图需要唯一索引才能使用 CONCURRENTLY 刷新

**解决方案**：迁移脚本已创建唯一索引，如果失败请手动创建：
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_stats_view_date ON task_stats_view(date);
```

### Q4: 触发器未生效

**排查步骤**：
1. 检查触发器是否存在
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_update_task%';
```

2. 检查触发器函数是否存在
```sql
\df+ update_task_path
\df+ update_task_leaf_status
```

3. 手动测试触发器
```sql
-- 测试update_task_path
INSERT INTO tasks (id, title, status, priority) 
VALUES ('test-id', 'Test', 'pending', 'medium')
RETURNING id, path, level;
```

### Q5: API Token生成失败

**原因**：PostgreSQL版本不支持 `gen_random_bytes()`

**解决方案**：
1. 升级到PostgreSQL 12+（推荐）
2. 或者使用 `uuid_generate_v4()` 替代：
```sql
UPDATE agents 
SET api_token = 'at_' || REPLACE(uuid_generate_v4()::TEXT, '-', '')
WHERE api_token IS NULL AND deleted_at IS NULL;
```

## 性能优化建议

### 1. 大数据量优化

如果现有数据量较大（>10万条），建议：

```sql
-- 分批更新Agent API Token
UPDATE agents 
SET api_token = 'at_' || encode(gen_random_bytes(32), 'hex')
WHERE api_token IS NULL AND deleted_at IS NULL
LIMIT 1000;

-- 重复执行直到所有Agent都有Token
```

### 2. 索引优化

根据实际查询场景，添加复合索引：

```sql
-- 任务查询优化
CREATE INDEX idx_tasks_status_deadline ON tasks(status, deadline) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status) 
WHERE deleted_at IS NULL;
```

### 3. 定期维护

```sql
-- 定期分析表（优化查询计划）
ANALYZE agents;
ANALYZE tasks;
ANALYZE agent_stats;
ANALYZE task_dependencies;

-- 重建索引（如果性能下降）
REINDEX TABLE tasks;
REINDEX TABLE agent_stats;
```

## 监控指标

迁移完成后，建议监控以下指标：

1. **数据库性能**
   - 查询响应时间（P95 < 200ms）
   - 索引命中率（> 95%）
   - 缓存命中率（> 90%）

2. **触发器性能**
   - 子任务创建时间（< 50ms）
   - 进度更新时间（< 100ms）

3. **物化视图刷新**
   - 刷新耗时（< 5秒）
   - 刷新频率（每小时）

## 技术支持

如有问题，请联系：
- **架构师**：技术方案评审
- **后端开发**：迁移执行和问题排查
- **DBA**：数据库性能优化

---

**迁移文件**: `20260304011200-V3.0.0-AddAgentManagementAndSubtasks.ts`
**创建时间**: 2026-03-04
**技术方案**: V3.0-technical-design.md
