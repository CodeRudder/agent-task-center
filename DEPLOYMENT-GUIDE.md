# TEST环境部署脚本使用指南

## 概述

`deploy-to-test.sh` 是TEST环境的**统一部署脚本**，解决以下问题：

1. ✅ **版本号统一管理** - 前后端使用统一版本号，避免版本不匹配
2. ✅ **自动化流程** - 拉取代码 → 构建 → 部署 → 健康检查 → 清理镜像
3. ✅ **自动清理过期镜像** - 保留最近10个版本，释放磁盘空间
4. ✅ **一键部署** - 直接执行即可完成所有步骤
5. ✅ **Docker网络管理** - 自动使用`docker compose`（新版本）避免Python库兼容性问题

## 版本号规则

**格式**：`v{backend_version}-test-{commit_hash}-{timestamp}`

**示例**：`v0.1.0-test-d23aa30-20260405-193000`

**说明**：
- `v0.1.0` - 后端package.json中的版本号
- `test` - 环境标识（TEST环境）
- `d23aa30` - Git commit短哈希
- `20260405-193000` - 时间戳（2026年4月5日19:30:00）

## 使用方法

### 完整部署（推荐）

```bash
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center
./deploy-to-test.sh
```

**执行流程**：
1. 拉取最新代码
2. 构建后端镜像
3. 构建前端镜像
4. 更新docker-compose.yml版本号
5. 部署到TEST环境（使用`docker compose`）
6. 健康检查
7. 清理过期镜像（保留最近10个）
8. **验证数据库表**（如果包含新的SQL迁移）

### 跳过某些步骤

```bash
# 跳过拉取代码（使用本地代码）
./deploy-to-test.sh --skip-pull

# 跳过构建镜像（使用已存在的镜像）
./deploy-to-test.sh --skip-build

# 跳过清理镜像
./deploy-to-test.sh --skip-cleanup

# 组合使用
./deploy-to-test.sh --skip-pull --skip-cleanup
```

### 使用自定义版本号

```bash
./deploy-to-test.sh --version v5.9-fix-7
```

**注意**：使用自定义版本号时，确保镜像已存在或使用`--skip-build`

### 查看帮助

```bash
./deploy-to-test.sh --help
```

## 部署验证

### 1. 检查容器状态

```bash
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/ops
docker compose -f docker-compose.merged-test.yml ps
```

**预期输出**：
```
NAME                                    STATUS              PORTS
agent-task-merged-test                  Up (healthy)        4100->80/tcp
agent-task-backend-merged-test          Up (healthy)        3000/tcp
agent-task-postgres-merged-test         Up (healthy)        5432/tcp
agent-task-redis-merged-test            Up (healthy)        6379/tcp
```

### 2. 检查后端日志

```bash
docker logs agent-task-backend-merged-test --tail 50
```

**预期输出**：
```
🚀 Application is running!
📝 API: http://localhost:3000/api/v1
📚 Docs: http://localhost:3000/api/docs
```

### 3. 检查前端页面

```bash
curl http://localhost:4100 | grep "<title>"
```

**预期输出**：
```
<title>Agent Task Management</title>
```

### 4. 验证数据库表（⚠️ 新增步骤）

**如果部署包含新的数据库表，必须验证**：

```bash
# 检查表是否存在
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -c "\dt"

# 检查表结构
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -c "\d table_name"
```

**示例**（Webhook表）：
```bash
# 检查webhook相关表
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -c "\dt | grep webhook"

# 预期输出：
# webhook_configurations | table | admin
# webhook_logs           | table | admin
```

### 5. 执行SQL迁移脚本（⚠️ 新增步骤）

**如果部署包含新的SQL迁移脚本，必须手动执行**：

```bash
# 1. 查看新增的SQL脚本
ls -lt backend/migrations/*.sql | head -5

# 2. 在TEST环境执行
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -f /path/to/migration.sql

# 3. 验证表结构
docker exec agent-task-postgres-merged-test psql -U admin -d agent_task_test -c "\d new_table"

# 4. 重启后端容器
docker restart agent-task-backend-merged-test
```

**注意**：
- SQL脚本必须在**后端容器启动前**或**后端容器重启后**执行
- TypeORM配置了`synchronize: false`，不会自动创建表
- 所有表结构变更必须通过SQL脚本管理

**预期输出**：
```
NAME                                    STATUS         PORTS
agent-task-backend-merged-test          Up 30 seconds 3000/tcp
agent-task-merged-test                  Up 30 seconds 0.0.0.0:4100->80/tcp
agent-task-postgres-merged-test         Up 30 seconds 5432/tcp
agent-task-redis-merged-test            Up 30 seconds 6379/tcp
```

### 2. 检查服务健康

```bash
# 前端服务
curl http://localhost:4100

# 后端健康检查
curl http://localhost:4100/api/v1/health
```

**预期响应**：
```json
{"status":"ok","timestamp":"2026-04-05T11:30:00.000Z"}
```

### 3. 查看容器日志

```bash
# 查看所有容器日志
docker-compose -f docker-compose.merged-test.yml logs -f

# 查看特定容器日志
docker logs agent-task-backend-merged-test
docker logs agent-task-merged-test
```

## 常见问题

### Q1: 部署失败，端口被占用

**问题**：端口4100已被占用

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :4100

# 停止旧的容器
docker stop agent-task-merged-test
docker rm agent-task-merged-test

# 重新部署
./deploy-to-test.sh
```

### Q2: 镜像构建失败

**问题**：Docker镜像构建失败

**解决方案**：
```bash
# 清理构建缓存
docker system prune -a

# 重新构建
./deploy-to-test.sh
```

### Q3: 前后端版本不匹配

**问题**：前端无法连接后端或API返回404

**解决方案**：
```bash
# 检查docker-compose.yml中的版本号
cat ops/docker-compose.merged-test.yml | grep image

# 确保前后端版本号一致
# 如果不一致，重新执行部署脚本
./deploy-to-test.sh
```

### Q4: 数据库连接失败

**问题**：后端日志显示数据库连接错误

**解决方案**：
```bash
# 检查PostgreSQL容器状态
docker ps | grep postgres

# 重启数据库容器
docker restart agent-task-postgres-merged-test

# 等待数据库启动后，重启后端容器
docker restart agent-task-backend-merged-test
```

## 镜像清理机制

脚本会自动清理过期的Docker镜像，**保留最近10个版本**。

**清理规则**：
- 按版本号排序（旧版本在前）
- 删除超过10个的旧版本
- 保留悬空镜像（dangling images）会被自动清理

**手动清理**：
```bash
# 查看所有镜像
docker images | grep agent-task

# 手动删除特定版本
docker rmi localhost:5000/agent-task-frontend:v0.1.0-test-abc123-20260401-120000

# 清理所有悬空镜像
docker image prune -a
```

## 版本回滚

如果新版本出现问题，可以快速回滚到旧版本：

```bash
# 1. 查看历史版本
docker images | grep agent-task

# 2. 修改docker-compose.yml中的版本号为旧版本
vim ops/docker-compose.merged-test.yml

# 3. 重新部署
cd ops
docker-compose -f docker-compose.merged-test.yml down
docker-compose -f docker-compose.merged-test.yml up -d
```

## 最佳实践

1. **定期清理镜像** - 脚本会自动清理，也可以手动运行`docker system prune -a`
2. **监控磁盘空间** - 使用`df -h`检查磁盘使用情况
3. **备份重要数据** - 部署前备份PostgreSQL数据（如果需要）
4. **查看日志** - 部署后查看容器日志，确保服务正常
5. **健康检查** - 部署后执行健康检查，验证服务可用性

## 环境信息

- **前端端口**：4100
- **后端端口**：3000（容器内部）
- **访问地址**：http://localhost:4100
- **API地址**：http://localhost:4100/api/v1
- **数据库**：agent_task_test
- **Redis**：默认配置

## 更新日志

- **2026-04-05** - 创建统一部署脚本，解决版本号不一致问题
- **2026-04-05** - 添加自动清理过期镜像功能
- **2026-04-05** - 添加健康检查和详细日志输出

## 联系支持

如果遇到问题，请联系：
- **架构师**：@architect
- **运维**：@ops
- **开发群**：#dev-working-group
