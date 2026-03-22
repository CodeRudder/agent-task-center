import { Module, Global } from '@nestjs/common';

/**
 * 公共模块
 * 
 * 提供全局可用的公共组件：
 * - 装饰器
 * - 守卫
 * - 拦截器
 * - 过滤器
 */
@Global()
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class CommonModule {}
