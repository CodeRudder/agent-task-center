#!/bin/bash

# V5.9 Module生成脚本
# 用于生成V5.9新增的4个Module

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/home/gongdewei/work/projects/dev-working-group/agent-task-center/backend"
cd "$PROJECT_ROOT"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}V5.9 Module生成脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否在正确的目录
if [ ! -f "nest-cli.json" ]; then
    echo -e "${RED}错误：未找到nest-cli.json文件，请确认在正确的目录！${NC}"
    exit 1
fi

# V5.9新增Module列表
MODULES=(
    "webhook"
    "roles"
    "reports"
    "api-keys"
)

echo -e "${YELLOW}准备生成以下Module：${NC}"
for module in "${MODULES[@]}"; do
    echo "  - $module"
done
echo ""

# 确认
read -p "是否继续？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消${NC}"
    exit 0
fi

# 生成Module
echo -e "${GREEN}开始生成Module...${NC}"
echo ""

for module in "${MODULES[@]}"; do
    echo -e "${YELLOW}生成Module: $module${NC}"

    # 创建Module目录结构
    module_dir="src/modules/${module}"
    mkdir -p "$module_dir/controllers"
    mkdir -p "$module_dir/dto"
    mkdir -p "$module_dir/entities"
    mkdir -p "$module_dir/repositories"
    mkdir -p "$module_dir/services"

    # 创建Module文件
    module_file="$module_dir/${module}.module.ts"
    if [ -f "$module_file" ]; then
        echo -e "${YELLOW}  警告：Module文件已存在，跳过${NC}"
    else
        cat > "$module_file" <<EOF
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${module^}Controller } from './${module}.controller';
import { ${module^}Service } from './${module}.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [${module^}Controller],
  providers: [${module^}Service],
  exports: [${module^}Service],
})
export class ${module^}Module {}
EOF
        echo -e "${GREEN}  ✓ Module文件已创建：$module_file${NC}"
    fi

    # 创建Service文件
    service_file="$module_dir/services/${module}.service.ts"
    if [ ! -f "$service_file" ]; then
        cat > "$service_file" <<EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${module^}Service {
    constructor() {}

    async findAll() {
        // TODO: 实现查询逻辑
        return [];
    }

    async findOne(id: string) {
        // TODO: 实现查询单个逻辑
        return null;
    }

    async create(data: any) {
        // TODO: 实现创建逻辑
        return null;
    }

    async update(id: string, data: any) {
        // TODO: 实现更新逻辑
        return null;
    }

    async remove(id: string) {
        // TODO: 实现删除逻辑
        return null;
    }
}
EOF
        echo -e "${GREEN}  ✓ Service文件已创建：$service_file${NC}"
    fi

    # 创建Controller文件
    controller_file="$module_dir/controllers/${module}.controller.ts"
    if [ ! -f "$controller_file" ]; then
        cat > "$controller_file" <<EOF
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ${module^}Service } from '../services/${module}.service';

@Controller('${module}s')
export class ${module^}Controller {
    constructor(private readonly ${module}Service: ${module^}Service) {}

    @Get()
    async findAll() {
        return this.${module}Service.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.${module}Service.findOne(id);
    }

    @Post()
    async create(@Body() data: any) {
        return this.${module}Service.create(data);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.${module}Service.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.${module}Service.remove(id);
    }
}
EOF
        echo -e "${GREEN}  ✓ Controller文件已创建：$controller_file${NC}"
    fi

    echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Module生成完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 根据API接口设计完善Controller路由"
echo "2. 根据业务逻辑完善Service方法"
echo "3. 创建DTO类（CreateDto、UpdateDto等）"
echo "4. 在AppModule中注册新Module"
echo ""
