import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

declare module 'express' {
  export interface Request {
    requestId?: string;
    startTime?: number;
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 生成请求ID
    req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.startTime = Date.now();

    // 记录请求开始
    this.logger.log(
      `${req.method} ${req.url} - 开始处理`,
      `Request-${req.requestId}`,
    );

    // 监听响应完成
    res.on('finish', () => {
      const responseTime = Date.now() - (req.startTime || 0);
      const { statusCode } = res;

      // 记录请求完成
      this.logger.logRequest(
        req.method,
        req.url,
        statusCode,
        responseTime,
        req.requestId,
      );
    });

    next();
  }
}
