// Temporarily disabled due to missing @nestjs/websockets and socket.io dependencies
// TODO: Install @nestjs/websockets and socket.io packages to enable WebSocket functionality

/*
import {
  Injectable,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { Server } from 'socket.io';

export enum WebSocketEventType {
  TASK_PROGRESS_UPDATED = 'task:progress-updated',
  TASK_STATUS_CHANGED = 'task:status-changed',
  TASK_ASSIGNED = 'task:assigned',
  TASK_COMPLETED = 'task:completed',
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
}

export interface AuthenticatedSocket {
  id: string;
  userId: string;
  email: string;
  role: string;
  emit: (event: string, data?: any) => void;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/api/v1/realtime/task-progress',
})
@UseGuards(WsAuthGuard)
export class TaskProgressGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaskProgressGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();
  private readonly taskSubscriptions = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  @OnGatewayInit()
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  @OnGatewayConnection()
  handleConnection(client: AuthenticatedSocket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id} (${client.email})`);
    
    client.emit('connected', {
      message: 'Connected to task progress real-time service',
      subscribedTasks: Array.from(this.getTaskSubscriptions(client.id) || []),
    });
  }

  @OnGatewayDisconnect()
  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.removeTaskSubscriptions(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:task-progress')
  handleSubscribeTaskProgress(
    client: AuthenticatedSocket,
    payload: SubscribeTaskProgressPayload,
  ): void {
    if (!this.taskSubscriptions.has(payload.taskId)) {
      this.taskSubscriptions.set(payload.taskId, new Set());
    }
    
    const subscriptions = this.taskSubscriptions.get(payload.taskId);
    subscriptions?.add(client.id);
    
    this.logger.log(`Client ${client.id} subscribed to task ${payload.taskId}`);
    
    client.emit('subscribed', { taskId: payload.taskId });
  }

  @SubscribeMessage('unsubscribe:task-progress')
  handleUnsubscribeTaskProgress(
    client: AuthenticatedSocket,
    payload: UnsubscribeTaskProgressPayload,
  ): void {
    const subscriptions = this.taskSubscriptions.get(payload.taskId);
    if (subscriptions) {
      subscriptions.delete(client.id);
      
      if (subscriptions.size === 0) {
        this.taskSubscriptions.delete(payload.taskId);
      }
    }
    
    this.logger.log(`Client ${client.id} unsubscribed from task ${payload.taskId}`);
    
    client.emit('unsubscribed', { taskId: payload.taskId });
  }

  @SubscribeMessage('subscribe:my-tasks')
  handleSubscribeMyTasks(client: AuthenticatedSocket): void {
    const taskIds = this.getTaskSubscriptions(client.id) || [];
    
    taskIds.forEach(taskId => {
      if (!this.taskSubscriptions.has(taskId)) {
        this.taskSubscriptions.set(taskId, new Set());
      }
      const subscriptions = this.taskSubscriptions.get(taskId);
      subscriptions?.add(client.id);
    });
    
    this.logger.log(`Client ${client.id} subscribed to ${taskIds.length} tasks`);
    
    client.emit('subscribed:my-tasks', { count: taskIds.length });
  }

  @SubscribeMessage('unsubscribe:my-tasks')
  handleUnsubscribeMyTasks(client: AuthenticatedSocket): void {
    const allSubscriptions = this.taskSubscriptions;
    
    allSubscriptions.forEach((clients, taskId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    });
    
    this.logger.log(`Client ${client.id} unsubscribed from all tasks`);
    
    client.emit('unsubscribed:my-tasks', {});
  }

  private getTaskSubscriptions(clientId: string): string[] {
    const subscriptions: string[] = [];
    
    this.taskSubscriptions.forEach((clients, taskId) => {
      if (clients.has(clientId)) {
        subscriptions.push(taskId);
      }
    });
    
    return subscriptions;
  }

  private removeTaskSubscriptions(clientId: string): void {
    this.taskSubscriptions.forEach((clients, taskId) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    });
  }
}
*/

// Export empty types for now
export enum WebSocketEventType {
  TASK_PROGRESS_UPDATED = 'task:progress-updated',
  TASK_STATUS_CHANGED = 'task:status-changed',
  TASK_ASSIGNED = 'task:assigned',
  TASK_COMPLETED = 'task:completed',
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
}

export interface AuthenticatedSocket {
  id: string;
  userId: string;
  email: string;
  role: string;
  emit: (event: string, data?: any) => void;
}

export class TaskProgressGateway {
  constructor() {}
}
