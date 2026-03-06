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
      const mockExecutionContext = {} as any;

      const mockCallHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result: any) => {
          expect(result).toBeDefined();
          done();
        },
        error: done,
      });
    });
  });
});
