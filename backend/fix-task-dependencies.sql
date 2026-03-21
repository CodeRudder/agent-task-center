-- 修复task_dependencies表，使用snake_case列名
-- 删除旧表（如果存在）
DROP TABLE IF EXISTS task_dependencies CASCADE;

-- 创建新表，使用snake_case
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  dependency_type VARCHAR(20) DEFAULT 'blocking',
  is_blocking BOOLEAN DEFAULT true,
  auto_resolve BOOLEAN DEFAULT false,
  resolve_after_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束
ALTER TABLE task_dependencies
  ADD CONSTRAINT FK_task_dependencies_task_id
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_dependencies
  ADD CONSTRAINT FK_task_dependencies_depends_on_task_id
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 添加唯一约束
ALTER TABLE task_dependencies
  ADD CONSTRAINT task_dependencies_task_id_depends_on_task_id_key
  UNIQUE (task_id, depends_on_task_id);

-- 创建索引
CREATE INDEX IDX_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IDX_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);
