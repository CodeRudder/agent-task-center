# Agent 任务管理系统

基于 NestJS + React + PostgreSQL 的任务管理系统 MVP 版本。

## 技术栈

### 后端
- **框架**: NestJS 10
- **语言**: TypeScript 5
- **数据库**: PostgreSQL 15
- **ORM**: TypeORM
- **缓存**: Redis 7
- **认证**: JWT
- **代码规范**: ESLint + Prettier

### 前端
- **框架**: React 18
- **语言**: TypeScript 5
- **构建**: Vite 5
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP**: Axios

## 快速开始

### 前置要求
- Node.js >= 18
- Docker & Docker Compose
- pnpm (推荐) 或 npm

### 1. 克隆项目

```bash
git clone <repository-url>
cd agent-task-system
```

### 2. 启动基础设施

```bash
# 复制环境变量
cp .env.example .env

# 启动 PostgreSQL + Redis
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 启动后端

```bash
cd backend

# 安装依赖
pnpm install

# 运行数据库迁移
pnpm migration:run

# 启动开发服务器
pnpm start:dev
```

后端服务运行在: http://localhost:3000

### 4. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

前端应用运行在: http://localhost:5173

## 项目结构

```
agent-task-system/
├── backend/                # 后端服务
│   ├── src/
│   │   ├── modules/       # 功能模块
│   │   │   ├── auth/      # 认证模块
│   │   │   ├── user/      # 用户模块
│   │   │   ├── task/      # 任务模块
│   │   │   └── notification/ # 通知模块
│   │   ├── common/        # 公共模块
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   ├── config/        # 配置
│   │   └── main.ts        # 入口文件
│   ├── test/              # 测试
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── stores/        # 状态管理
│   │   ├── services/      # API服务
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── utils/         # 工具函数
│   │   ├── types/         # 类型定义
│   │   └── main.tsx       # 入口文件
│   └── package.json
├── docker/                 # Docker配置
├── docs/                   # 文档
├── docker-compose.yml      # 基础设施
└── .env.example           # 环境变量示例
```

## API 文档

启动后端后访问: http://localhost:3000/api/docs

## 核心功能（MVP）

### 第一阶段（第1-2周）
- [x] 项目骨架搭建
- [ ] 用户认证（注册/登录）
- [ ] 任务 CRUD
- [ ] 基础 UI 框架

### 第二阶段（第3-4周）
- [ ] 任务进度跟踪
- [ ] HTTP 轮询通知
- [ ] 任务列表/看板视图

### 第三阶段（第5-6周）
- [ ] 通知系统集成
- [ ] 数据统计
- [ ] 性能优化

## 开发规范

### Git 工作流
```bash
# 分支命名
feature/task-crud    # 新功能
bugfix/login-error   # Bug修复
hotfix/security      # 紧急修复

# Commit 信息
feat: 添加任务创建功能
fix: 修复登录验证问题
refactor: 重构用户服务
test: 添加任务单元测试
docs: 更新API文档
```

### 代码规范
- 遵循 ESLint + Prettier 配置
- 变量/函数: camelCase
- 类/组件: PascalCase
- 常量: UPPER_SNAKE_CASE
- 文件: kebab-case

### 测试要求
- 单元测试覆盖率 > 80%
- 关键路径必须有测试
- 测试命名: `should_xxx_when_xxx`

## 常用命令

### 后端
```bash
pnpm start:dev          # 开发模式
pnpm build              # 构建
pnpm test               # 运行测试
pnpm test:cov           # 测试覆盖率
pnpm lint               # 代码检查
pnpm format             # 代码格式化
pnpm migration:generate # 生成迁移
pnpm migration:run      # 运行迁移
```

### 前端
```bash
pnpm dev                # 开发模式
pnpm build              # 构建
pnpm preview            # 预览构建
pnpm test               # 运行测试
pnpm lint               # 代码检查
```

### Docker
```bash
docker-compose up -d            # 启动服务
docker-compose down             # 停止服务
docker-compose logs -f          # 查看日志
docker-compose restart          # 重启服务
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DB_HOST | 数据库地址 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_USERNAME | 数据库用户 | admin |
| DB_PASSWORD | 数据库密码 | admin123 |
| DB_DATABASE | 数据库名 | agent_task |
| REDIS_HOST | Redis地址 | localhost |
| REDIS_PORT | Redis端口 | 6379 |
| JWT_SECRET | JWT密钥 | - |
| PORT | 后端端口 | 3000 |

## 故障排查

### 数据库连接失败
```bash
# 检查PostgreSQL状态
docker-compose ps postgres

# 查看日志
docker-compose logs postgres
```

### Redis连接失败
```bash
# 检查Redis状态
docker-compose ps redis

# 测试连接
docker-compose exec redis redis-cli ping
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
