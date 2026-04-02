#!/bin/bash

# V5.9 Entity生成脚本
# 用于生成V5.9新增的7个Entity

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
echo -e "${GREEN}V5.9 Entity生成脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否在正确的目录
if [ ! -f "nest-cli.json" ]; then
    echo -e "${RED}错误：未找到nest-cli.json文件，请确认在正确的目录！${NC}"
    exit 1
fi

# V5.9新增Entity列表
ENTITIES=(
    "webhook-configuration"
    "webhook-log"
    "role"
    "user-role"
    "report-analytic"
    "api-key"
    "api-usage-log"
)

echo -e "${YELLOW}准备生成以下Entity：${NC}"
for entity in "${ENTITIES[@]}"; do
    echo "  - $entity"
done
echo ""

# 确认
read -p "是否继续？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消${NC}"
    exit 0
fi

# 生成Entity
echo -e "${GREEN}开始生成Entity...${NC}"
echo ""

for entity in "${ENTITIES[@]}"; do
    echo -e "${YELLOW}生成Entity: $entity${NC}"

    # 使用NestJS CLI生成Entity
    # 注意：这里需要根据实际的项目结构调整命令
    # 如果项目使用了自定义的Entity生成器，需要相应调整

    # 方式1：使用NestJS CLI（如果配置了）
    # nest g entity "$entity" --module=webhook

    # 方式2：手动创建Entity文件
    # 创建Entity文件
    entity_file="src/modules/webhook/entities/${entity}.entity.ts"
    if [ -f "$entity_file" ]; then
        echo -e "${YELLOW}  警告：Entity文件已存在，跳过${NC}"
    else
        mkdir -p "$(dirname "$entity_file")"
        cat > "$entity_file" <<EOF
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('${entity}')
export class ${entity^}Entity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @ApiProperty()
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
EOF
        echo -e "${GREEN}  ✓ Entity文件已创建：$entity_file${NC}"
    fi

    echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Entity生成完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 根据数据库设计完善Entity字段定义"
echo "2. 添加Entity之间的关系（@ManyToOne, @OneToMany等）"
echo "3. 生成DTO和Repository"
echo ""
