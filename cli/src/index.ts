#!/usr/bin/env node

/**
 * V5.4 Task Management CLI - Entry Point
 * @description CLI工具入口文件
 */

import { Command } from 'commander';
import { registerTaskCommands } from './commands/task';
import { loadConfig, saveConfig } from './utils/config';

const program = new Command();

program
  .name('task-cli')
  .description('任务管理系统命令行工具')
  .version('1.0.0');

// 配置命令
program
  .command('config')
  .description('配置CLI工具')
  .option('--api-url <url>', 'API地址')
  .option('--token <token>', '认证Token')
  .option('--format <format>', '默认输出格式（json/table）')
  .option('--page-size <size>', '默认页大小')
  .action((options) => {
    const configUpdate: any = {};
    if (options.apiUrl) configUpdate.apiUrl = options.apiUrl;
    if (options.token) configUpdate.token = options.token;
    if (options.format) configUpdate.outputFormat = options.format;
    if (options.pageSize) configUpdate.defaultPageSize = parseInt(options.pageSize);

    saveConfig(configUpdate);
    console.log('配置更新成功');
    console.log('当前配置:', loadConfig());
  });

// 注册任务命令
registerTaskCommands(program);

// 解析命令行参数
program.parse(process.argv);

// 如果没有参数，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
