import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errors = responseObj.errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 记录详细错误日志（所有环境）
    if (exception instanceof Error) {
      this.logger.logError(
        exception,
        request.requestId,
        'HttpExceptionFilter',
      );
    } else {
      this.logger.error(
        `Unknown exception: ${exception}`,
        '',
        'HttpExceptionFilter',
      );
    }

    const errorResponse: ApiResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
      ...(request.requestId && { requestId: request.requestId }),
    };

    response.status(status).json(errorResponse);
  }
}
