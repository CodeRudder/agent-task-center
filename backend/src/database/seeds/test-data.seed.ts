import { DataSource } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../../modules/task/entities/task.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Tag } from '../../modules/tag/entities/tag.entity';
import { Category } from '../../modules/category/entities/category.entity';
import * as bcrypt from 'bcrypt';

export async function seedTestData(dataSource: DataSource) {
  console.log('开始插入测试数据...');

  const userRepository = dataSource.getRepository(User);
  const taskRepository = dataSource.getRepository(Task);
  const tagRepository = dataSource.getRepository(Tag);
  const categoryRepository = dataSource.getRepository(Category);

  // 1. 创建测试用户（3个）
  console.log('创建测试用户...');
  const users = [
    {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Admin User',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'admin',
    },
    {
      email: 'user@example.com',
      username: 'user',
      name: 'Normal User',
      password: await bcrypt.hash('User123!', 10),
      role: 'user',
    },
    {
      email: 'guest@example.com',
      username: 'guest',
      name: 'Guest User',
      password: await bcrypt.hash('Guest123!', 10),
      role: 'guest',
    },
  ];

  for (const userData of users) {
    const existingUser = await userRepository.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      await userRepository.save(userData);
      console.log(`✅ 创建用户: ${userData.email}`);
    }
  }

  // 2. 创建标签（5个）
  console.log('创建标签...');
  const tags = [
    { name: '前端', description: '前端开发相关', color: '#3B82F6' },
    { name: '后端', description: '后端开发相关', color: '#10B981' },
    { name: '测试', description: '测试相关', color: '#F59E0B' },
    { name: '文档', description: '文档相关', color: '#8B5CF6' },
    { name: '紧急', description: '紧急任务', color: '#EF4444' },
  ];

  for (const tagData of tags) {
    const existingTag = await tagRepository.findOne({ where: { name: tagData.name } });
    if (!existingTag) {
      await tagRepository.save(tagData);
      console.log(`✅ 创建标签: ${tagData.name}`);
    }
  }

  // 3. 创建分类（3个）
  console.log('创建分类...');
  const categories = [
    { name: '功能开发', description: '新功能开发任务', color: '#3B82F6' },
    { name: 'Bug修复', description: 'Bug修复任务', color: '#EF4444' },
    { name: '优化改进', description: '性能优化和改进', color: '#10B981' },
  ];

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({ where: { name: categoryData.name } });
    if (!existingCategory) {
      await categoryRepository.save(categoryData);
      console.log(`✅ 创建分类: ${categoryData.name}`);
    }
  }

  // 4. 创建任务（20个）
  console.log('创建任务...');
  const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
  const normalUser = await userRepository.findOne({ where: { email: 'user@example.com' } });

  const tasks = [
    { title: '实现用户登录功能', description: '实现基于JWT的用户登录功能', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: adminUser },
    { title: '设计任务列表页面', description: '设计并实现任务列表UI', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assignee: normalUser },
    { title: '编写API文档', description: '为所有API接口编写Swagger文档', status: TaskStatus.TODO, priority: TaskPriority.LOW, assignee: adminUser },
    { title: '实现任务过滤功能', description: '支持按状态、优先级、负责人过滤任务', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: normalUser },
    { title: '优化数据库查询', description: '优化任务列表查询性能', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assignee: adminUser },
    { title: '实现任务标签功能', description: '支持为任务添加标签', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: normalUser },
    { title: '实现任务分类功能', description: '支持为任务添加分类', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: adminUser },
    { title: '实现任务依赖关系', description: '支持任务之间的依赖关系', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assignee: normalUser },
    { title: '编写单元测试', description: '为核心模块编写单元测试', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assignee: adminUser },
    { title: '实现报表统计功能', description: '实现任务统计报表', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: normalUser },
    { title: '修复登录bug', description: '修复特定场景下登录失败的问题', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: adminUser },
    { title: '优化前端性能', description: '优化前端页面加载速度', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assignee: normalUser },
    { title: '实现权限管理', description: '实现基于角色的权限管理', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assignee: adminUser },
    { title: '编写集成测试', description: '为关键流程编写集成测试', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: normalUser },
    { title: '实现任务评论功能', description: '支持为任务添加评论', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.LOW, assignee: adminUser },
    { title: '优化UI交互', description: '改善用户界面交互体验', status: TaskStatus.TODO, priority: TaskPriority.LOW, assignee: normalUser },
    { title: '实现任务模板', description: '支持创建任务模板', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: adminUser },
    { title: '实现批量操作', description: '支持批量删除、修改任务', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: normalUser },
    { title: '实现任务导出', description: '支持导出任务到CSV', status: TaskStatus.DONE, priority: TaskPriority.LOW, assignee: adminUser },
    { title: '实现任务提醒', description: '支持任务到期提醒', status: TaskStatus.TODO, priority: TaskPriority.HIGH, assignee: normalUser },
  ];

  for (const taskData of tasks) {
    const existingTask = await taskRepository.findOne({ where: { title: taskData.title } });
    if (!existingTask) {
      await taskRepository.save({
        ...taskData,
        assignee: taskData.assignee || undefined
      });
      console.log(`✅ 创建任务: ${taskData.title}`);
    }
  }

  console.log('✅ 测试数据插入完成！');
}
