# 测试账号文档

## 📋 固定测试账号（请勿随意修改）

**⚠️ 重要提醒**：
- 这些是固定测试账号，请勿随意修改密码
- 发布时**严禁**重新初始化用户数据
- 如需修改，必须先通知团队

---

## 🏭 生产环境（PROD）- 端口5100

| 邮箱 | 密码 | 角色 | 用途 |
|------|------|------|------|
| admin@prod.com | admin123 | ADMIN | 管理员账号 |
| qa@prod.com | qa123 | QA | QA测试账号 |
| test@test.com | test123 | user | 普通用户测试 |
| test2@example.com | - | user | 备用测试账号 |

---

## 🔧 开发环境（DEV）- 端口3103

| 邮箱 | 密码 | 角色 | 用途 |
|------|------|------|------|
| admin@dev.com | admin123 | ADMIN | 开发管理员 |
| test@dev.com | test123 | user | 开发测试 |

---

## 🧪 测试环境（TEST）- 端口3103

| 邮箱 | 密码 | 角色 | 用途 |
|------|------|------|------|
| admin@test.com | admin123 | ADMIN | 测试管理员 |
| test@test.com | test123 | user | 测试账号 |

---

## 🚫 发布规范

### 严禁事项
1. ❌ 发布时重新初始化用户数据
2. ❌ 删除或修改现有测试账号
3. ❌ 在生产环境运行 DROP TABLE 或 TRUNCATE
4. ❌ 使用 `synchronize: true` 在生产环境（会重建表）

### 发布脚本检查项
- [ ] docker-compose.prod.yml 使用了 volume 持久化数据
- [ ] 数据库容器使用 volume：`postgres_prod_data`
- [ ] Redis 容器使用 volume：`redis_prod_data`
- [ ] 发布脚本不会删除 volumes

### 当前配置验证 ✅
```yaml
# docker-compose.prod.yml 中已配置持久化卷
volumes:
  postgres_prod_data:
  redis_prod_data:
```

---

## 🔐 密码重置方法

如果需要重置密码，使用以下命令：

```bash
# 生成密码hash
cd ~/workspace/shard-projects/agent-task-center/backend
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('新密码', 10));"

# 更新数据库
docker exec agent-task-postgres-prod psql -U admin -d agent_task_prod \
  -c "UPDATE users SET password = '生成的hash' WHERE email = '用户邮箱';"
```

---

## 📝 更新日志

| 日期 | 操作 | 操作人 |
|------|------|--------|
| 2026-03-19 | 创建文档，设置固定测试账号密码 | Claw2-Ops |
| 2026-03-19 | 重置 test@test.com 密码为 test123 | Claw2-Ops |
| 2026-03-19 | 设置 admin@prod.com 密码为 admin123 | Claw2-Ops |
| 2026-03-19 | 设置 qa@prod.com 密码为 qa123 | Claw2-Ops |

---

**维护人**：Claw2-Ops  
**创建时间**：2026-03-19  
**最后更新**：2026-03-19
