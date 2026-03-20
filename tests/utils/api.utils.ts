/**
 * API测试工具类
 * 提供通用的API测试辅助函数
 */

import * as request from 'supertest';
import { config } from '../config/test.config';

export class APIUtils {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string = config.api.baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  /**
   * 设置认证token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 获取当前token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * GET请求
   */
  async get(path: string, query?: any): Promise<request.Response> {
    const req = request(this.baseUrl)
      .get(`${config.api.prefix}${path}`)
      .timeout(config.api.timeout);

    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }

    if (query) {
      req.query(query);
    }

    return req;
  }

  /**
   * POST请求
   */
  async post(path: string, body?: any): Promise<request.Response> {
    const req = request(this.baseUrl)
      .post(`${config.api.prefix}${path}`)
      .timeout(config.api.timeout)
      .set('Content-Type', 'application/json');

    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }

    if (body) {
      req.send(body);
    }

    return req;
  }

  /**
   * PUT请求
   */
  async put(path: string, body?: any): Promise<request.Response> {
    const req = request(this.baseUrl)
      .put(`${config.api.prefix}${path}`)
      .timeout(config.api.timeout)
      .set('Content-Type', 'application/json');

    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }

    if (body) {
      req.send(body);
    }

    return req;
  }

  /**
   * PATCH请求
   */
  async patch(path: string, body?: any): Promise<request.Response> {
    const req = request(this.baseUrl)
      .patch(`${config.api.prefix}${path}`)
      .timeout(config.api.timeout)
      .set('Content-Type', 'application/json');

    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }

    if (body) {
      req.send(body);
    }

    return req;
  }

  /**
   * DELETE请求
   */
  async delete(path: string): Promise<request.Response> {
    const req = request(this.baseUrl)
      .delete(`${config.api.prefix}${path}`)
      .timeout(config.api.timeout);

    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }

    return req;
  }

  /**
   * 登录并获取token
   */
  async login(email?: string, password?: string): Promise<{ token: string; user: any }> {
    const loginEmail = email || config.api.testUser.email;
    const loginPassword = password || config.api.testUser.password;

    const response = await this.post('/auth/login', {
      email: loginEmail,
      password: loginPassword,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`登录失败: ${response.status}`);
    }

    const { accessToken, user } = response.body.data || response.body;
    this.token = accessToken;

    return { token: accessToken, user };
  }

  /**
   * 注册新用户
   */
  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ token: string; user: any }> {
    const response = await this.post('/auth/register', userData);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`注册失败: ${response.status}`);
    }

    const { accessToken, user } = response.body.data || response.body;
    this.token = accessToken;

    return { token: accessToken, user };
  }

  /**
   * 登出（清除token）
   */
  logout(): void {
    this.token = null;
  }
}
