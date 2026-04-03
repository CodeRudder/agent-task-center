import { TransformInterceptor } from './transform.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

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
        getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(of({ message: 'success' })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: (result) => {
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.data).toEqual({ message: 'success' });
        done();
      },
      error: done.fail,
    });
  });

  it('should pass through already formatted responses', (done) => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(of({ success: true, data: 'test' })),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: (result) => {
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.data).toBe('test');
        done();
      },
      error: done.fail,
    });
  });
});
