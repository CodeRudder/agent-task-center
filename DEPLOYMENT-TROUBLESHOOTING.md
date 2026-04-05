# 部署问题排查指南

## 问题：V5.9-fix-7修复未生效，TEST环境运行旧镜像

### 问题分析

根据claw-scheduler的反馈，ops在部署V5.9-fix-7时遇到问题：
- 修复代码已提交
- Docker镜像已构建
- 但TEST环境仍然运行旧版本镜像

### 根本原因

**版本号不一致**：
- `docker-compose.yml`中硬编码了旧版本号
- 镜像标签与实际运行容器不匹配
- 部署时没有正确更新版本号

**示例**：
```yaml
# docker-compose.merged-test.yml（旧版本）
services:
  frontend-test:
    image: localhost:5000/agent-task-frontend:v5.2-merged  # ❌ 硬编码旧版本
  backend-test:
    image: localhost:5000/agent-task-system:v5.7-p2-test  # ❌ 硬编码旧版本
```

### 解决方案

#### 方案1：使用统一部署脚本（推荐）✅

**执行部署**：
```bash
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center
./deploy-to-test.sh
```

**脚本功能**：
1. ✅ 自动生成统一版本号（前后端一致）
2. ✅ 自动更新`docker-compose.yml`中的版本号
3. ✅ 构建并推送新镜像
4. ✅ 重启容器（使用新镜像）
5. ✅ 自动清理过期镜像（保留最近10个）
6. ✅ 健康检查

#### 方案2：手动部署（不推荐）⚠️

**步骤**：

1. **生成版本号**：
```bash
# 获取commit hash
commit_hash=$(git rev-parse --short HEAD)

# 生成时间戳
timestamp=$(date +%Y%m%d-%H%M%S)

# 组合版本号
version="v5.9-fix-7-${commit_hash}-${timestamp}"
echo $version
```

2. **构建镜像**：
```bash
# 后端
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/backend
docker build -t localhost:5000/agent-task-system:$version .
docker push localhost:5000/agent-task-system:$version

# 前端
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/frontend
docker build -f Dockerfile.merged -t localhost:5000/agent-task-frontend:$version .
docker push localhost:5000/agent-task-frontend:$version
```

3. **更新docker-compose.yml**：
```bash
vim /home/gongdewei/work/projects/dev-working-group/agent-task-center/ops/docker-compose.merged-test.yml
```

**修改**：
```yaml
services:
  frontend-test:
    image: localhost:5000/agent-task-frontend:$version  # 使用新版本
  backend-test:
    image: localhost:5000/agent-task-system:$version    # 使用新版本
```

4. **重启容器**：
```bash
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center/ops
docker-compose -f docker-compose.merged-test.yml down
docker-compose -f docker-compose.merged-test.yml up -d
```

5. **验证部署**：
```bash
# 检查容器状态
docker-compose -f docker-compose.merged-test.yml ps

# 检查镜像版本
docker inspect agent-task-backend-merged-test | grep Image
docker inspect agent-task-merged-test | grep Image

# 健康检查
curl http://localhost:4100/api/v1/health
```

### 验证部署成功

#### 1. 检查容器镜像版本

```bash
# 检查后端容器镜像
docker inspect agent-task-backend-merged-test --format='{{.Config.Image}}'

# 检查前端容器镜像
docker inspect agent-task-merged-test --format='{{.Config.Image}}'
```

**预期输出**：
```
localhost:5000/agent-task-system:v5.9-fix-7-d23aa30-20260405-193000
localhost:5000/agent-task-frontend:v5.9-fix-7-d23aa30-20260405-193000
```

#### 2. 检查容器启动时间

```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep agent-task
```

**预期输出**：
```
NAMES                                     STATUS
agent-task-backend-merged-test            Up 2 minutes
agent-task-merged-test                    Up 2 minutes
agent-task-postgres-merged-test           Up 2 minutes
agent-task-redis-merged-test              Up 2 minutes
```

#### 3. 检查服务日志

```bash
# 后端日志
docker logs agent-task-backend-merged-test --tail 50

# 前端日志
docker logs agent-task-merged-test --tail 50
```

#### 4. 功能测试

```bash
# 健康检查
curl http://localhost:4100/api/v1/health

# 登录测试
curl -X POST http://localhost:4100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 常见错误及解决方法

#### 错误1：镜像不存在

**错误信息**：
```
ERROR: pull access denied for localhost:5000/agent-task-system, repository does not exist or may require 'docker login'
```

**解决方案**：
```bash
# 检查镜像是否存在
docker images | grep agent-task

# 如果不存在，重新构建
./deploy-to-test.sh --skip-pull
```

#### 错误2：端口被占用

**错误信息**：
```
ERROR: for frontend-test  Bind for 0.0.0.0:4100 failed: port is already allocated
```

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :4100

# 停止旧容器
docker stop agent-task-merged-test
docker rm agent-task-merged-test

# 重新部署
./deploy-to-test.sh --skip-build
```

#### 错误3：容器启动失败

**错误信息**：
```
ERROR: for backend-test  Cannot start service backend-test: ... exited with code 1
```

**解决方案**：
```bash
# 查看容器日志
docker logs agent-task-backend-merged-test

# 检查配置文件
cat ops/docker-compose.merged-test.yml

# 手动运行容器（调试）
docker run --rm -p 3000:3000 localhost:5000/agent-task-system:$version
```

#### 错误4：数据库连接失败

**错误信息**：
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**：
```bash
# 检查PostgreSQL容器状态
docker ps | grep postgres

# 重启数据库容器
docker restart agent-task-postgres-merged-test

# 等待数据库启动（约5秒）
sleep 5

# 重启后端容器
docker restart agent-task-backend-merged-test
```

### 预防措施

#### 1. 使用统一部署脚本

**推荐**：
```bash
# 每次部署都使用统一脚本
./deploy-to-test.sh
```

**优势**：
- ✅ 自动生成版本号（避免手动错误）
- ✅ 自动更新docker-compose.yml（避免版本不一致）
- ✅ 自动清理过期镜像（节省磁盘空间）
- ✅ 健康检查（确保服务正常）

#### 2. 版本号规范化

**规则**：
- 前后端使用**统一版本号**
- 版本号包含：版本 + 环境 + commit + 时间戳
- 示例：`v5.9-fix-7-d23aa30-20260405-193000`

#### 3. 部署前检查

**检查清单**：
- [ ] 代码已提交到Git仓库
- [ ] 版本号已更新（如果需要）
- [ ] 测试环境端口4100未被占用
- [ ] 磁盘空间充足（至少5GB）
- [ ] Docker服务运行正常

#### 4. 部署后验证

**验证步骤**：
1. 检查容器状态（`docker ps`）
2. 检查镜像版本（`docker inspect`）
3. 检查服务日志（`docker logs`）
4. 健康检查（`curl /api/v1/health`）
5. 功能测试（登录、创建任务等）

### 长期优化方案

#### 1. 集成CI/CD

**方案**：使用GitLab CI或GitHub Actions

**流程**：
1. 代码提交到`prepare/v5.9`分支
2. CI自动触发构建
3. 自动运行测试
4. 测试通过后自动部署到TEST环境

#### 2. 版本管理工具

**方案**：使用语义化版本工具（如`semantic-release`）

**优势**：
- 自动生成版本号
- 自动生成changelog
- 避免手动错误

#### 3. 监控和告警

**方案**：集成Prometheus + Grafana

**监控指标**：
- 容器状态（UP/DOWN）
- 服务健康状态
- 错误率
- 响应时间

**告警规则**：
- 容器宕机超过1分钟
- 错误率超过5%
- 响应时间超过3秒

### 总结

**问题根源**：版本号管理不规范，导致前后端镜像版本不匹配

**最佳实践**：
1. ✅ 使用统一部署脚本（`deploy-to-test.sh`）
2. ✅ 前后端使用统一版本号
3. ✅ 自动生成版本号（避免手动错误）
4. ✅ 自动清理过期镜像（保留最近10个）
5. ✅ 部署后验证（健康检查 + 功能测试）

**立即行动**：
```bash
cd /home/gongdewei/work/projects/dev-working-group/agent-task-center
./deploy-to-test.sh
```

---

**文档版本**：v1.0
**更新时间**：2026-04-05
**维护人**：@architect
