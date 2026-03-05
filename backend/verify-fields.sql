-- 验证task_templates表的defaultPriority字段
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'task_templates' 
AND column_name = 'defaultPriority';

-- 验证tasks表的templateId字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'templateId';

-- 验证task_templates表的created_by字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_templates' 
AND column_name = 'created_by';

-- 验证索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tasks' 
AND indexname = 'idx_tasks_template_id';
