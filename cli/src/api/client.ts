/**
 * V5.4 Task Management CLI - API Client
 * @description HTTP客户端封装
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getApiUrl, getToken } from '../utils/config';
import { ApiResponse, Task, CreateTaskOptions, UpdateTaskOptions, ListTasksOptions } from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 请求拦截器：添加Token
    this.client.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 响应拦截器：统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('API错误:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('网络错误:', error.message);
        } else {
          console.error('错误:', error.message);
        }
        throw error;
      }
    );
  }

  /**
   * 创建任务
   */
  async createTask(options: CreateTaskOptions): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.post('/tasks', options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 查询任务列表
   */
  async listTasks(options: ListTasksOptions): Promise<ApiResponse<Task[]>> {
    try {
      const params: any = {};
      if (options.status) params.status = options.status;
      if (options.priority) params.priority = options.priority;
      if (options.assignee) params.assignee = options.assignee;
      if (options.project) params.project = options.project;
      if (options.page) params.page = options.page;
      if (options.pageSize) params.pageSize = options.pageSize;

      const response = await this.client.get('/tasks', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 查询任务详情
   */
  async getTask(id: string): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新任务
   */
  async updateTask(id: string, options: UpdateTaskOptions): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.patch(`/tasks/${id}`, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新任务进度
   */
  async updateProgress(id: string, progress: number, note?: string): Promise<ApiResponse<Task>> {
    try {
      const response = await this.client.patch(`/tasks/${id}/progress`, { progress, note });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
