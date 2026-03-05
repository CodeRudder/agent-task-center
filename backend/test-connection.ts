import { DataSource } from 'typeorm';
import { TaskTemplate } from './src/modules/templates/entities/task-template.entity';
import { Task } from './src/modules/task/entities/task.entity';

async function testConnection() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'admin',
    password: 'admin123',
    database: 'agent_task_test',
    entities: [TaskTemplate, Task],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    // 测试TaskTemplate实体
    const templateRepo = dataSource.getRepository(TaskTemplate);
    const templateCount = await templateRepo.count();
    console.log(`✅ TaskTemplate实体映射正常，当前记录数: ${templateCount}`);

    // 测试Task实体
    const taskRepo = dataSource.getRepository(Task);
    const taskCount = await taskRepo.count();
    console.log(`✅ Task实体映射正常，当前记录数: ${taskCount}`);

    // 测试字段
    const template = await templateRepo.findOne({ where: {} as any });
    if (template) {
      console.log(`✅ TaskTemplate.defaultPriority字段存在: ${template.defaultPriority}`);
      console.log(`✅ TaskTemplate.createdById字段映射正确: ${template.createdById}`);
    }

    const task = await taskRepo.findOne({ where: {} as any });
    if (task) {
      console.log(`✅ Task.templateId字段存在: ${task.templateId || 'null'}`);
    }

    await dataSource.destroy();
    console.log('\n✅ 所有验证通过！');
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

testConnection();
