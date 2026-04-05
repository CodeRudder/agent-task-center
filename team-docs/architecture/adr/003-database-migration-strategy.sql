# ADR-003: 数据库表管理策略 - SQL脚本优先

## 状态
已接受（2026-04-05）

## 背景
在V5.9开发过程中，发现TypeORM的`synchronize: true`自动建表功能在生产环境中存在多个问题：

1. **缺乏版本控制**：自动生成的表结构无法追溯变更历史
2. **部署不一致**：开发/测试/生产环境的表结构可能因代码版本不同而不同
3. **回滚困难**：自动建表无法轻松回滚到之前的表结构
4. **Webhook表缺失问题**：TEST环境部署时发现`webhook_configurations`和`webhook_logs`表缺失，因为`app.module.ts`配置了`synchronize: false`，但缺少相应的SQL初始化脚本

## 决策
**弃用TypeORM自动建表功能，全面采用SQL脚本管理数据库表结构。**

### 核心原则

1. **SQL脚本优先**：所有表结构变更必须通过SQL脚本执行
2. **版本化管理**：每个SQL脚本文件名包含版本号（如`migrate_v59_add_api_keys_table.sql`）
3. **向前兼容**：新脚本必须考虑已有数据的迁移
4. **测试先行**：SQL脚本必须在TEST环境验证后才能应用到PROD

### 具体规范

#### 1. 禁用TypeORM同步

**配置**（`app.module.ts`）：
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ...
    synchronize: false, // 禁用自动建表
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // ...
  }),
}),
```

#### 2. SQL脚本目录结构

```
backend/
├── migrations/                    # SQL迁移脚本（主要）
│   ├── init-complete-database.sql
│   ├── create-webhook-tables.sql
│   ├── migrate_v52_to_v53.sql
│   ├── migrate_v55_add_votes_and_feishu.sql
│   └── migrate_v59_add_api_keys_table.sql
├── sql/                          # 辅助SQL脚本
│   ├── init.sql
│   └── fix-*.sql
└── scripts/                      # 数据工具脚本
    └── test-data.sql
```

#### 3. SQL脚本命名规范

**格式**：`migrate_v{VERSION}_{ACTION}_{DESCRIPTION}.sql`

**示例**：
- `migrate_v59_add_api_keys_table.sql` - V5.9版本添加api_keys表
- `migrate_v60_add_webhook_tables.sql` - V6.0版本添加webhook表
- `rollback_v59_remove_permissions_tables.sql` - 回滚V5.9的权限表

#### 4. SQL脚本内容规范

**必须包含**：
```sql
-- ============================================================================
-- Migration Title
-- ============================================================================
-- Description: Clear description of what this migration does
-- Version: V5.9-fix
-- Date: 2026-04-05
-- Author: architect
-- Dependencies: migrate_v59_add_api_keys_table.sql
-- ============================================================================

-- Migration SQL here...

-- ============================================================================
-- Migration Complete
-- ============================================================================
```

#### 5. 表创建模板

```sql
-- Create table with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... other columns
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);

-- Add foreign keys (optional)
-- ALTER TABLE table_name
--   ADD CONSTRAINT fk_table_reference
--   FOREIGN KEY (column) REFERENCES other_table(id);
```

#### 6. 部署流程

**TEST环境**：
```bash
# 1. 审查SQL脚本
cat backend/migrations/migrate_v60_*.sql

# 2. 测试环境执行
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -f migrations/migrate_v60_*.sql

# 3. 验证表结构
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -c "\d new_table"

# 4. 运行测试套件
npm run test:e2e
```

**PROD环境**：
```bash
# 1. 备份数据库
pg_dump -h localhost -U admin agent_task > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行迁移
docker exec agent-task-postgres-prod psql -U admin -d agent_task -f migrations/migrate_v60_*.sql

# 3. 验证数据完整性
docker exec agent-task-postgres-prod psql -U admin -d agent_task -c "SELECT COUNT(*) FROM new_table;"
```

## 后果

### 正面影响

1. **版本控制**：所有表结构变更可追溯、可回滚
2. **部署一致性**：开发/测试/生产环境表结构完全一致
3. **审计合规**：SQL脚本提供清晰的变更历史
4. **团队协作**：DBA和开发者可以使用统一的SQL语言

### 负面影响

1. **开发效率**：需要手动编写SQL脚本，不能依赖自动建表
2. **学习曲线**：团队成员需要熟悉SQL和数据库管理
3. **维护成本**：需要维护SQL脚本和TypeORM实体的一致性

### 缓解措施

1. **实体生成工具**：可以编写工具从SQL生成TypeORM实体
2. **代码审查**：所有SQL脚本必须经过架构师审查
3. **文档完善**：提供SQL编写规范和最佳实践文档

## 实施计划

### 第一阶段（立即执行）

1. ✅ 创建`create-webhook-tables.sql`迁移脚本
2. ✅ 在TEST环境执行并验证
3. ⏳ 更新`DEPLOYMENT-GUIDE.md`，添加SQL脚本执行步骤

### 第二阶段（V5.10-V6.0）

1. ⏳ 审查现有所有SQL脚本，统一命名和格式
2. ⏳ 创建"从SQL生成TypeORM实体"的工具脚本
3. ⏳ 建立SQL脚本审查流程

### 第三阶段（V6.0+）

1. ⏳ 所有新功能必须先写SQL迁移脚本
2. ⏳ 禁止使用TypeORM的`synchronize: true`
3. ⏳ 建立自动化测试验证SQL脚本

## 参考资料

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Database Migration Best Practices](https://martinfowler.com/articles/evodb.html)
- V5.9 Webhook表缺失问题复盘（`memory/2026-04-05.md`）

---

**决策者**：architect
**审查者**：待定（需DBA或tech lead审查）
**生效日期**：2026-04-05
**下次审查**：V6.0发布后（2026-04-19）
