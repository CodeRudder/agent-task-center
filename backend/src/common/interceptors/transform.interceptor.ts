import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 如果返回的数据已经有success字段，说明已经被处理过了，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 包装成统一格式
        return {
          success: true,
          statusCode: context.switchToHttp().getResponse().statusCode || 200,
          data: data,
        };
      }),
    );
  }
}