import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Exception:', exception);
      }
    }

    const errorResponse: ApiResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
    };

    response.status(status).json(errorResponse);
  }
}
