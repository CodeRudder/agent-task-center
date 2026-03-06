import { TransformInterceptor } from './transform.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform response data', (done) => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: (result) => {
        expect(result).toBeDefined();
        expect(result.data).toBe('test');
        done();
      },
      error: done.fail,
    });
  });

  it('should add timestamp to response', (done) => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(of({ message: 'success' })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: (result) => {
        expect(result).toBeDefined();
        expect(result.timestamp).toBeDefined();
        done();
      },
      error: done.fail,
    });
  });
});
