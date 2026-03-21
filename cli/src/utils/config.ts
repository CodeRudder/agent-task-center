/**
 * V5.4 Task Management CLI - Config Management
 * @description 配置管理工具
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types';

const CONFIG_FILE = path.join(process.env.HOME || '', '.task-cli.config.json');

const DEFAULT_CONFIG: Config = {
  apiUrl: 'http://localhost:3002/api',
  token: '',
  outputFormat: 'table',
  defaultPageSize: 20
};

/**
 * 加载配置文件
 */
export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.error('加载配置文件失败:', error);
  }
  return DEFAULT_CONFIG;
}

/**
 * 保存配置文件
 */
export function saveConfig(config: Partial<Config>): void {
  try {
    const currentConfig = loadConfig();
    const newConfig = { ...currentConfig, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    console.log('配置已保存到:', CONFIG_FILE);
  } catch (error) {
    console.error('保存配置文件失败:', error);
  }
}

/**
 * 获取API URL
 */
export function getApiUrl(): string {
  const config = loadConfig();
  return config.apiUrl;
}

/**
 * 获取Token
 */
export function getToken(): string {
  const config = loadConfig();
  return config.token;
}

/**
 * 获取输出格式
 */
export function getOutputFormat(): 'json' | 'table' {
  const config = loadConfig();
  return config.outputFormat;
}

/**
 * 获取默认页大小
 */
export function getDefaultPageSize(): number {
  const config = loadConfig();
  return config.defaultPageSize;
}
