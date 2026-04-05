# 测试环境配置模板

## .env.test 文件模板

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=agent_task

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT Configuration
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRATION=7d

# Server Configuration
PORT=3001
NODE_ENV=test

# API Configuration
API_PREFIX=api/v1
```

## 测试环境初始化脚本

### test/jest.setup.ts

```typescript
import { config } from 'dotenv';

// 根据环境加载不同的配置文件
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const result = config({ path: envFile });

if (result.error) {
  console.warn(`Warning: .env.${process.env.NODE_ENV} file not found`);
}

// 设置测试超时
jest.setTimeout(30000);
```

### package.json Jest配置更新

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "setupFiles": ["<rootDir>/../test/jest.setup.ts"],
    "moduleNameMapper": {
      "@common/(.*)": "<rootDir>/common/$1",
      "@modules/(.*)": "<rootDir>/modules/$1",
      "@config/(.*)": "<rootDir>/config/$1"
    }
  }
}
```

## QA环境检查清单

### 1. 数据库检查
```bash
# 检查PostgreSQL是否运行
ps aux | grep postgres

# 检查测试数据库端口
netstat -an | grep 5433

# 连接测试数据库
psql -h localhost -p 5433 -U admin -d agent_task
```

### 2. Redis检查
```bash
# 检查Redis是否运行
ps aux | grep redis

# 检查测试Redis端口
netstat -an | grep 6380

# 测试Redis连接
redis-cli -p 6380 ping
```

### 3. Node环境检查
```bash
# 检查Node版本
node -v

# 检查npm版本
npm -v

# 检查依赖是否安装
ls -la node_modules/.bin/jest
```

### 4. 配置文件检查
```bash
# 检查环境变量文件
ls -la .env .env.test

# 检查Jest配置
cat package.json | grep -A 20 '"jest"'
```

## 常见问题及解决方案

### 问题1: 数据库连接失败
**错误**: `connect ECONNREFUSED 127.0.0.1:5433`

**解决方案**:
```bash
# 启动测试数据库
docker run -d \
  --name test-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=agent_task \
  -p 5433:5432 \
  postgres:15
```

### 问题2: Redis连接失败
**错误**: `connect ECONNREFUSED 127.0.0.1:6380`

**解决方案**:
```bash
# 启动测试Redis
docker run -d \
  --name test-redis \
  -p 6380:6379 \
  redis:7-alpine
```

### 问题3: 依赖版本不一致
**错误**: 测试行为与本地不一致

**解决方案**:
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 测试运行脚本

### 完整测试流程
```bash
# 1. 停止现有服务
npm run stop

# 2. 设置测试环境
export NODE_ENV=test

# 3. 运行测试
npm test

# 4. 查看覆盖率
npm run test:cov
```

### 单个测试套件
```bash
# 测试UserService
npm test -- user.service.spec

# 测试TaskService
npm test -- task.service.spec

# 测试状态流转
npm test -- task.service.status-flow.spec
```

## 预期结果

### 成功标准
- 数据库连接正常
- Redis连接正常
- 所有测试套件编译通过
- 测试通过率达到95%以上

### 失败处理
如果测试失败，检查：
1. 环境变量是否正确
2. 数据库是否运行
3. Redis是否运行
4. 依赖是否完整
5. 端口是否被占用

---
**注意**: 此文档为配置模板，实际使用时需要根据QA环境的具体情况调整。
