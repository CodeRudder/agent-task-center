import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../logger/logger.service';

describe('HttpExceptionFilter - Complete Coverage', () => {
  let filter: HttpExceptionFilter;
  let logger: LoggerService;

  beforeEach(() => {
    logger = new LoggerService('Test');
    filter = new HttpExceptionFilter(logger);
  });

  describe('catch', () => {
    it('should handle HttpException', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => ({ url: '/test' }),
        }),
      } as any;

      const exception = new HttpException('Test error', 400);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle generic Error', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => ({ url: '/test' }),
        }),
      } as any;

      const exception = new Error('Generic error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
