/**
 * V5.4 Task Management CLI - Formatter
 * @description 输出格式化工具
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { Task } from '../types';

/**
 * 格式化任务列表为表格
 */
export function formatTasksTable(tasks: Task[]): string {
  const table = new Table({
    head: [
      chalk.cyan.bold('ID'),
      chalk.cyan.bold('标题'),
      chalk.cyan.bold('状态'),
      chalk.cyan.bold('优先级'),
      chalk.cyan.bold('指派人'),
      chalk.cyan.bold('截止日期')
    ],
    colWidths: [15, 30, 12, 10, 15, 12],
    wordWrap: true
  });

  tasks.forEach((task) => {
    table.push([
      task.id,
      task.title,
      getStatusText(task.status),
      getPriorityText(task.priority),
      task.assignee?.name || '-',
      task.dueDate ? formatDate(task.dueDate) : '-'
    ]);
  });

  return table.toString();
}

/**
 * 格式化任务详情
 */
export function formatTaskDetail(task: Task): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.cyan('\n📋 任务详情\n'));
  lines.push(`${chalk.bold('ID:')}           ${task.id}`);
  lines.push(`${chalk.bold('标题:')}         ${task.title}`);
  lines.push(`${chalk.bold('描述:')}         ${task.description || '-'}`);
  lines.push(`${chalk.bold('状态:')}         ${getStatusText(task.status)}`);
  lines.push(`${chalk.bold('优先级:')}       ${getPriorityText(task.priority)}`);
  lines.push(`${chalk.bold('指派人:')}       ${task.assignee?.name || '-'}`);
  lines.push(`${chalk.bold('项目:')}         ${task.project?.name || '-'}`);
  lines.push(`${chalk.bold('进度:')}         ${task.progress || 0}%`);
  lines.push(`${chalk.bold('截止日期:')}     ${task.dueDate ? formatDate(task.dueDate) : '-'}`);
  lines.push(`${chalk.bold('创建时间:')}     ${formatDateTime(task.createdAt)}`);
  lines.push(`${chalk.bold('更新时间:')}     ${formatDateTime(task.updatedAt)}`);
  
  return lines.join('\n');
}

/**
 * 格式化JSON输出
 */
export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * 格式化成功消息
 */
export function formatSuccess(message: string): string {
  return chalk.green.bold('✓ ') + chalk.green(message);
}

/**
 * 格式化错误消息
 */
export function formatError(message: string): string {
  return chalk.red.bold('✗ ') + chalk.red(message);
}

/**
 * 格式化警告消息
 */
export function formatWarning(message: string): string {
  return chalk.yellow.bold('⚠ ') + chalk.yellow(message);
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'todo': chalk.gray('待办'),
    'in_progress': chalk.blue('进行中'),
    'completed': chalk.green('已完成'),
    'accepted': chalk.cyan('已验收'),
    'rejected': chalk.red('已驳回'),
    'blocked': chalk.yellow('阻塞中')
  };
  return statusMap[status] || status;
}

/**
 * 获取优先级文本
 */
function getPriorityText(priority: string): string {
  const priorityMap: Record<string, string> = {
    'P0': chalk.red.bold('P0'),
    'P1': chalk.yellow.bold('P1'),
    'P2': chalk.blue.bold('P2'),
    'P3': chalk.gray.bold('P3')
  };
  return priorityMap[priority] || priority;
}

/**
 * 格式化日期
 */
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * 格式化日期时间
 */
function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').substring(0, 19);
}
