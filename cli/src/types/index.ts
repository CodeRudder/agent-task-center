/**
 * V5.4 Task Management CLI - Type Definitions
 * @description TypeScript类型定义
 */

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3'
}

export interface User {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: User;
  project?: Project;
  progress: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskOptions {
  title: string;
  description?: string;
  priority?: TaskPriority | string;
  assignee?: string;
  dueDate?: string;
  project?: string;
}

export interface UpdateTaskOptions {
  title?: string;
  description?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  assignee?: string;
  progress?: number;
  dueDate?: string;
}

export interface ListTasksOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  project?: string;
  page?: number;
  pageSize?: number;
  format?: 'json' | 'table';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Config {
  apiUrl: string;
  token: string;
  outputFormat: 'json' | 'table';
  defaultPageSize: number;
}
