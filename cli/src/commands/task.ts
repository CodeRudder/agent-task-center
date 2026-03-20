/**
 * V5.4 Task Management CLI - Task Commands
 * @description 任务相关命令处理
 */

import { Command } from 'commander';
import { apiClient } from '../api/client';
import { formatTasksTable, formatTaskDetail, formatJson, formatSuccess, formatError } from '../utils/formatter';
import { getOutputFormat } from '../utils/config';

/**
 * 注册任务命令
 */
export function registerTaskCommands(program: Command): void {
  const taskCmd = program.command('task').description('任务管理命令');

  // task create - 创建任务
  taskCmd
    .command('create')
    .description('创建任务')
    .requiredOption('-t, --title <title>', '任务标题')
    .option('-d, --description <description>', '任务描述')
    .option('-p, --priority <priority>', '优先级（P0/P1/P2/P3）', 'P2')
    .option('-a, --assignee <assignee>', '指派人ID')
    .option('--due-date <dueDate>', '截止日期（YYYY-MM-DD）')
    .option('--project <projectId>', '所属项目ID')
    .option('-f, --format <format>', '输出格式（json/table）', getOutputFormat())
    .action(async (options) => {
      try {
        const task = await apiClient.createTask({
          title: options.title,
          description: options.description,
          priority: options.priority,
          assignee: options.assignee,
          dueDate: options.dueDate,
          project: options.project
        });

        if (options.format === 'json') {
          console.log(formatJson(task));
        } else {
          console.log(formatSuccess('任务创建成功'));
          if (task.data) {
            console.log(formatTaskDetail(task.data));
          }
        }
      } catch (error) {
        console.error(formatError('任务创建失败'));
        process.exit(1);
      }
    });

  // task list - 查询任务列表
  taskCmd
    .command('list')
    .description('查询任务列表')
    .option('-s, --status <status>', '任务状态（todo/in_progress/completed/accepted/rejected）')
    .option('-p, --priority <priority>', '优先级（P0/P1/P2/P3）')
    .option('-a, --assignee <assignee>', '指派人ID')
    .option('--project <projectId>', '所属项目ID')
    .option('--page <page>', '页码', '1')
    .option('--page-size <pageSize>', '每页数量', '20')
    .option('-f, --format <format>', '输出格式（json/table）', getOutputFormat())
    .action(async (options) => {
      try {
        const result = await apiClient.listTasks({
          status: options.status,
          priority: options.priority,
          assignee: options.assignee,
          project: options.project,
          page: parseInt(options.page),
          pageSize: parseInt(options.pageSize)
        });

        if (options.format === 'json') {
          console.log(formatJson(result));
        } else {
          if (result.data && result.data.length > 0) {
            console.log(formatTasksTable(result.data));
            console.log(`\n共 ${result.data.length} 个任务`);
          } else {
            console.log(formatSuccess('没有找到任务'));
          }
        }
      } catch (error) {
        console.error(formatError('查询任务列表失败'));
        process.exit(1);
      }
    });

  // task show - 查看任务详情
  taskCmd
    .command('show')
    .description('查看任务详情')
    .requiredOption('-i, --id <id>', '任务ID')
    .option('-f, --format <format>', '输出格式（json/table）', getOutputFormat())
    .action(async (options) => {
      try {
        const task = await apiClient.getTask(options.id);

        if (options.format === 'json') {
          console.log(formatJson(task));
        } else {
          if (task.data) {
            console.log(formatTaskDetail(task.data));
          }
        }
      } catch (error) {
        console.error(formatError('查询任务详情失败'));
        process.exit(1);
      }
    });

  // task update - 更新任务
  taskCmd
    .command('update')
    .description('更新任务')
    .requiredOption('-i, --id <id>', '任务ID')
    .option('-t, --title <title>', '任务标题')
    .option('-d, --description <description>', '任务描述')
    .option('-s, --status <status>', '任务状态')
    .option('-p, --priority <priority>', '优先级')
    .option('-a, --assignee <assignee>', '指派人ID')
    .option('--progress <progress>', '进度（0-100）')
    .option('--due-date <dueDate>', '截止日期')
    .option('-f, --format <format>', '输出格式（json/table）', getOutputFormat())
    .action(async (options) => {
      try {
        const updateData: any = {};
        if (options.title) updateData.title = options.title;
        if (options.description) updateData.description = options.description;
        if (options.status) updateData.status = options.status;
        if (options.priority) updateData.priority = options.priority;
        if (options.assignee) updateData.assignee = options.assignee;
        if (options.progress) updateData.progress = parseInt(options.progress);
        if (options.dueDate) updateData.dueDate = options.dueDate;

        const task = await apiClient.updateTask(options.id, updateData);

        if (options.format === 'json') {
          console.log(formatJson(task));
        } else {
          console.log(formatSuccess('任务更新成功'));
          if (task.data) {
            console.log(formatTaskDetail(task.data));
          }
        }
      } catch (error) {
        console.error(formatError('任务更新失败'));
        process.exit(1);
      }
    });

  // task delete - 删除任务
  taskCmd
    .command('delete')
    .description('删除任务')
    .requiredOption('-i, --id <id>', '任务ID')
    .action(async (options) => {
      try {
        await apiClient.deleteTask(options.id);
        console.log(formatSuccess('任务删除成功'));
      } catch (error) {
        console.error(formatError('任务删除失败'));
        process.exit(1);
      }
    });

  // task status - 更新任务状态
  taskCmd
    .command('status')
    .description('更新任务状态')
    .requiredOption('-i, --id <id>', '任务ID')
    .requiredOption('-a, --action <action>', '操作类型（start/complete/accept/reject/block）')
    .option('-f, --format <format>', '输出格式（json/table）', getOutputFormat())
    .action(async (options) => {
      try {
        const statusMap: Record<string, string> = {
          'start': 'in_progress',
          'complete': 'completed',
          'accept': 'accepted',
          'reject': 'rejected',
          'block': 'blocked'
        };

        const status = statusMap[options.action];
        if (!status) {
          throw new Error(`无效的操作类型: ${options.action}`);
        }

        const task = await apiClient.updateTask(options.id, { status });

        if (options.format === 'json') {
          console.log(formatJson(task));
        } else {
          console.log(formatSuccess('任务状态更新成功'));
          if (task.data) {
            console.log(formatTaskDetail(task.data));
          }
        }
      } catch (error) {
        console.error(formatError('任务状态更新失败'));
        process.exit(1);
      }
    });

  // task progress - 更新进度
  taskCmd
    .command('progress')
    .description('更新任务进度')
    .requiredOption('-i, --id <id>', '任务ID')
    .requiredOption('-p, --progress <progress>', '进度（0-100）')
    .option('-n, --note <note>', '进度说明')
    .option('-f, --format <format>', '输出格式（json/table）', getOutputFormat())
    .action(async (options) => {
      try {
        const task = await apiClient.updateProgress(
          options.id,
          parseInt(options.progress),
          options.note
        );

        if (options.format === 'json') {
          console.log(formatJson(task));
        } else {
          console.log(formatSuccess('进度更新成功'));
          if (task.data) {
            console.log(formatTaskDetail(task.data));
          }
        }
      } catch (error) {
        console.error(formatError('进度更新失败'));
        process.exit(1);
      }
    });
}
