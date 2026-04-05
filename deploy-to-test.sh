#!/bin/bash
# Agent Task Center - TEST环境统一部署脚本
# 用途：自动构建前后端镜像、部署到TEST环境、清理过期镜像

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$PROJECT_ROOT/ops"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 获取统一版本号
get_version() {
    cd "$PROJECT_ROOT"
    
    # 获取最新的commit hash（短格式）
    local commit_hash=$(git rev-parse --short HEAD)
    
    # 获取当前时间戳
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    # 获取最新版本号（从package.json）
    local backend_version=$(node -p "require('$BACKEND_DIR/package.json').version")
    local frontend_version=$(node -p "require('$FRONTEND_DIR/package.json').version")
    
    # 组合版本号：格式 v{backend_version}-test-{commit_hash}-{timestamp}
    echo "v${backend_version}-test-${commit_hash}-${timestamp}"
}

# 清理过期Docker镜像（保留最近10个版本）
cleanup_old_images() {
    echo -e "${BLUE}🧹 清理过期Docker镜像...${NC}"
    
    # 清理前端镜像（保留最近10个）
    echo "清理前端镜像（保留最近10个）..."
    docker images localhost:5000/agent-task-frontend --format "{{.Tag}}" | \
        grep -E "^v[0-9]" | \
        sort -V | \
        head -n -10 | \
        while read tag; do
            echo "  删除镜像: localhost:5000/agent-task-frontend:$tag"
            docker rmi localhost:5000/agent-task-frontend:$tag 2>/dev/null || true
        done
    
    # 清理后端镜像（保留最近10个）
    echo "清理后端镜像（保留最近10个）..."
    docker images localhost:5000/agent-task-system --format "{{.Tag}}" | \
        grep -E "^v[0-9]" | \
        sort -V | \
        head -n -10 | \
        while read tag; do
            echo "  删除镜像: localhost:5000/agent-task-system:$tag"
            docker rmi localhost:5000/agent-task-system:$tag 2>/dev/null || true
        done
    
    # 清理悬空镜像
    echo "清理悬空镜像..."
    docker image prune -f
    
    echo -e "${GREEN}✅ 镜像清理完成${NC}"
}

# 拉取最新代码
pull_latest_code() {
    echo -e "${BLUE}📥 拉取最新代码...${NC}"
    cd "$PROJECT_ROOT"
    
    # 获取当前分支
    local current_branch=$(git branch --show-current)
    echo "当前分支: $current_branch"
    
    # 拉取最新代码
    git fetch origin
    git reset --hard origin/$current_branch
    
    echo -e "${GREEN}✅ 代码已更新${NC}"
}

# 更新docker-compose.yml中的版本号
update_compose_version() {
    local version=$1
    echo -e "${BLUE}📝 更新docker-compose版本号...${NC}"
    
    local compose_file="$OPS_DIR/docker-compose.merged-test.yml"
    
    # 备份原文件
    cp "$compose_file" "${compose_file}.bak"
    
    # 更新前端镜像版本
    sed -i "s|localhost:5000/agent-task-frontend:[^ ]*|localhost:5000/agent-task-frontend:$version|g" "$compose_file"
    
    # 更新后端镜像版本
    sed -i "s|localhost:5000/agent-task-system:[^ ]*|localhost:5000/agent-task-system:$version|g" "$compose_file"
    
    echo -e "${GREEN}✅ 版本号已更新为: $version${NC}"
}

# 构建前端镜像
build_frontend() {
    local version=$1
    echo -e "${BLUE}🔨 构建前端镜像...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # 确保nginx配置文件存在
    if [ ! -f "$OPS_DIR/nginx/merged-port.conf" ]; then
        echo -e "${RED}❌ 错误: nginx配置文件不存在: $OPS_DIR/nginx/merged-port.conf${NC}"
        exit 1
    fi
    
    # 创建临时nginx目录
    mkdir -p "$FRONTEND_DIR/nginx"
    cp "$OPS_DIR/nginx/merged-port.conf" "$FRONTEND_DIR/nginx/"
    
    # 构建前端镜像
    docker build -f Dockerfile.merged -t localhost:5000/agent-task-frontend:$version .
    
    # 推送到本地registry
    docker push localhost:5000/agent-task-frontend:$version
    
    echo -e "${GREEN}✅ 前端镜像构建完成${NC}"
}

# 构建后端镜像
build_backend() {
    local version=$1
    echo -e "${BLUE}🔨 构建后端镜像...${NC}"
    
    cd "$BACKEND_DIR"
    
    # 构建后端镜像
    docker build -t localhost:5000/agent-task-system:$version .
    
    # 推送到本地registry
    docker push localhost:5000/agent-task-system:$version
    
    echo -e "${GREEN}✅ 后端镜像构建完成${NC}"
}

# 部署到TEST环境
deploy_to_test() {
    echo -e "${BLUE}🚀 部署到TEST环境...${NC}"
    
    cd "$OPS_DIR"
    
    # 停止现有容器
    echo "停止现有容器..."
    docker-compose -f docker-compose.merged-test.yml down
    
    # 启动新容器
    echo "启动新容器..."
    docker-compose -f docker-compose.merged-test.yml up -d
    
    # 等待服务健康检查
    echo "等待服务启动..."
    sleep 10
    
    # 检查容器状态
    echo "检查容器状态..."
    docker-compose -f docker-compose.merged-test.yml ps
    
    echo -e "${GREEN}✅ 部署完成${NC}"
}

# 健康检查
health_check() {
    echo -e "${BLUE}🔍 执行健康检查...${NC}"
    
    # 检查前端
    echo "检查前端服务..."
    if curl -f -s http://localhost:4100 > /dev/null; then
        echo -e "${GREEN}✅ 前端服务正常${NC}"
    else
        echo -e "${RED}❌ 前端服务异常${NC}"
    fi
    
    # 检查后端
    echo "检查后端服务..."
    if curl -f -s http://localhost:4100/api/v1/health > /dev/null; then
        echo -e "${GREEN}✅ 后端服务正常${NC}"
    else
        echo -e "${RED}❌ 后端服务异常${NC}"
    fi
}

# 显示使用帮助
show_help() {
    cat << EOF
用法: $0 [选项]

TEST环境统一部署脚本 - 自动构建、部署、清理镜像

选项:
    -h, --help          显示此帮助信息
    --skip-pull         跳过拉取代码
    --skip-build        跳过构建镜像（仅部署）
    --skip-cleanup      跳过清理旧镜像
    --version VERSION   指定版本号（默认自动生成）

示例:
    $0                          # 完整流程：拉取代码、构建、部署、清理
    $0 --skip-pull              # 跳过拉取代码
    $0 --skip-cleanup           # 不清理旧镜像
    $0 --version v5.9-fix-7     # 使用指定版本号

注意:
    - 版本号格式: v{backend_version}-test-{commit_hash}-{timestamp}
    - 前后端使用统一版本号，避免版本不匹配
    - 自动清理过期镜像，只保留最近10个版本
    - TEST环境端口: 4100

EOF
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Agent Task Center - TEST环境部署${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # 解析参数
    local skip_pull=false
    local skip_build=false
    local skip_cleanup=false
    local custom_version=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --skip-pull)
                skip_pull=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-cleanup)
                skip_cleanup=true
                shift
                ;;
            --version)
                custom_version="$2"
                shift 2
                ;;
            *)
                echo -e "${RED}❌ 未知参数: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 获取版本号
    local VERSION="$custom_version"
    if [ -z "$VERSION" ]; then
        VERSION=$(get_version)
    fi
    
    echo -e "${GREEN}📦 部署版本: $VERSION${NC}"
    echo ""
    
    # 1. 拉取最新代码（可选）
    if [ "$skip_pull" = false ]; then
        pull_latest_code
    else
        echo -e "${YELLOW}⚠️  跳过拉取代码${NC}"
    fi
    
    # 2. 构建镜像（可选）
    if [ "$skip_build" = false ]; then
        build_backend "$VERSION"
        build_frontend "$VERSION"
    else
        echo -e "${YELLOW}⚠️  跳过构建镜像${NC}"
    fi
    
    # 3. 更新docker-compose版本号
    update_compose_version "$VERSION"
    
    # 4. 部署到TEST环境
    deploy_to_test
    
    # 5. 健康检查
    health_check
    
    # 6. 清理旧镜像（可选）
    if [ "$skip_cleanup" = false ]; then
        cleanup_old_images
    else
        echo -e "${YELLOW}⚠️  跳过清理镜像${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ 部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "🌐 访问地址: ${BLUE}http://localhost:4100${NC}"
    echo -e "📦 部署版本: ${BLUE}$VERSION${NC}"
    echo ""
}

# 执行主函数
main "$@"
