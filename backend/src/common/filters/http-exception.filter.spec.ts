import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let logger: LoggerService;

  beforeEach(() => {
    logger = new LoggerService('Test');
    filter = new HttpExceptionFilter(logger);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch HttpException and format response', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        }),
        getRequest: jest.fn().mockReturnValue({
          url: '/test',
        }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockContext);

    const response = mockContext.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalled();
  });

  it('should handle internal server error', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        }),
        getRequest: jest.fn().mockReturnValue({
          url: '/test',
        }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new Error('Unknown error');

    filter.catch(exception, mockContext);

    const response = mockContext.switchToHttp().getResponse();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalled();
  });
});
