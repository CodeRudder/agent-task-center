import { TransformInterceptor } from './transform.interceptor';
import { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor<any>();
  });

  describe('intercept', () => {
    it('should transform response', (done) => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue({
            statusCode: 200,
          }),
        }),
      } as any;

      const mockCallHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: any) => {
          expect(result).toBeDefined();
          expect(result.success).toBe(true);
          expect(result.data).toEqual({ data: 'test' });
          done();
        },
        error: done,
      });
    });
  });
});
