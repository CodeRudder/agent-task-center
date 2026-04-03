import { Injectable, LoggerService as NestLoggerService, Scope, Optional } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(@Optional() context?: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { context: context || 'Application' },
      transports: [
        // 错误日志文件
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // 组合日志文件（所有级别）
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    });

    // 开发环境添加控制台输出
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              const stackStr = stack ? `\n${stack}` : '';
              return `${timestamp} [${level}] [${context || 'Application'}] ${message} ${metaStr}${stackStr}`;
            }),
          ),
        }),
      );
    }
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // 记录HTTP请求
  logRequest(method: string, url: string, statusCode: number, responseTime: number, requestId?: string) {
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    this.logger.info(message, {
      context: 'HTTP',
      requestId,
      method,
      url,
      statusCode,
      responseTime,
    });
  }

  // 记录错误详情
  logError(exception: Error, requestId?: string, context?: string) {
    this.logger.error(exception.message, {
      context: context || 'Error',
      requestId,
      stack: exception.stack,
      name: exception.name,
    });
  }
}
