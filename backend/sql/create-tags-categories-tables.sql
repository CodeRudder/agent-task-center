-- 创建tags表
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建categories表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#10B981',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建task_tags中间表
CREATE TABLE IF NOT EXISTS task_tags (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- 创建task_categories中间表
CREATE TABLE IF NOT EXISTS task_categories (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, category_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_task ON task_categories(task_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_category ON task_categories(category_id);

-- 插入一些测试标签
INSERT INTO tags (name, description, color) VALUES
    ('重要', '重要任务', '#EF4444'),
    ('紧急', '紧急任务', '#F59E0B'),
    ('Bug修复', 'Bug修复任务', '#8B5CF6'),
    ('功能开发', '新功能开发', '#3B82F6'),
    ('文档', '文档相关任务', '#10B981')
ON CONFLICT DO NOTHING;

-- 插入一些测试分类
INSERT INTO categories (name, description, color) VALUES
    ('前端', '前端开发任务', '#3B82F6'),
    ('后端', '后端开发任务', '#10B981'),
    ('测试', '测试相关任务', '#F59E0B'),
    ('运维', '运维部署任务', '#8B5CF6'),
    ('设计', 'UI/UX设计任务', '#EC4899')
ON CONFLICT DO NOTHING;
