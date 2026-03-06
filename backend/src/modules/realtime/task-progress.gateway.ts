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

export enum WebSocketEventType {
  TASK_PROGRESS_UPDATED = 'task:progress-updated',
  TASK_STATUS_CHANGED = 'task:status-changed',
  TASK_ASSIGNED = 'task:assigned',
  TASK_COMPLETED = 'task:completed',
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
}

interface SubscribeTaskProgressPayload {
  taskId: string;
}

interface UnsubscribeTaskProgressPayload {
  taskId: string;
}

interface BroadcastTaskProgressPayload {
  taskId: string;
  agentId: string;
  progress: number;
  status: string;
  timestamp: number;
}

interface BroadcastTaskStatusPayload {
  taskId: string;
  oldStatus: string;
  newStatus: string;
  agentId: string;
  timestamp: number;
}

export interface AuthenticatedSocket extends ConnectedSocket {
  userId: string;
  email: string;
  role: string;
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
  server: WebSocketServer;

  private readonly logger = new Logger(TaskProgressGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();
  private readonly taskSubscriptions = new Map<string, Set<string>>(); // taskId -> Set of clientIds

  constructor(private readonly jwtService: JwtService) {}

  @OnGatewayInit()
  afterInit(server: WebSocketServer) {
    this.logger.log('WebSocket Gateway initialized');
  }

  @OnGatewayConnection()
  handleConnection(client: AuthenticatedSocket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id} (${client.email})`);
    
    // Send welcome message with subscribed tasks
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
    // Subscribe to all tasks assigned to this user
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

  private broadcastTaskProgress(payload: BroadcastTaskProgressPayload): void {
    const subscribers = this.taskSubscriptions.get(payload.taskId);
    
    if (!subscribers || subscribers.size === 0) {
      this.logger.log(`No subscribers for task ${payload.taskId}, skipping broadcast`);
      return;
    }
    
    this.logger.log(`Broadcasting progress for task ${payload.taskId} to ${subscribers.size} subscribers`);
    
    subscribers.forEach(clientId => {
      const client = this.connectedClients.get(clientId);
      if (client) {
        this.server.to(clientId).emit(WebSocketEventType.TASK_PROGRESS_UPDATED, {
          taskId: payload.taskId,
          progress: payload.progress,
          agentId: payload.agentId,
          timestamp: payload.timestamp,
        });
      }
    });
  }

  private broadcastTaskStatus(payload: BroadcastTaskStatusPayload): void {
    const subscribers = this.taskSubscriptions.get(payload.taskId);
    
    if (!subscribers || subscribers.size === 0) {
      return;
    }
    
    subscribers.forEach(clientId => {
      const client = this.connectedClients.get(clientId);
      if (client) {
        this.server.to(clientId).emit(WebSocketEventType.TASK_STATUS_CHANGED, {
          taskId: payload.taskId,
          oldStatus: payload.oldStatus,
          newStatus: payload.newStatus,
          agentId: payload.agentId,
          timestamp: payload.timestamp,
        });
      }
    });
  }

  private broadcastNotification(payload: any): void {
    // Broadcast notification to all connected clients
    this.server.emit(WebSocketEventType.NOTIFICATION_CREATED, payload);
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
