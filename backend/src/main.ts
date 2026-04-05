import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, NestModule, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { XssMiddleware } from './common/middleware/xss.middleware';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // XSS Protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    const middleware = new XssMiddleware();
    middleware.use(req, res, next);
  });

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // API Prefix
  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api/v1'));

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        // 只返回第一个错误
        const firstError = errors[0];
        const constraints = firstError.constraints;

        if (!constraints) {
          return new BadRequestException('请求参数验证失败');
        }

        // 将class-validator的英文错误消息转换为中文
        const chineseMessages: Record<string, string> = {
          'isEmail': '邮箱格式不正确',
          'isString': '必须是字符串',
          'min': '值太小',
          'max': '值太大',
          'minLength': '密码长度至少8位',
          'maxLength': '密码长度不能超过20位',
          'isNotEmpty': '字段不能为空',
          'isDefined': '字段是必填的',
          'matches': '格式不正确',
          'isBoolean': '必须是布尔值',
          'isNumber': '必须是数字',
          'isUUID': '必须是有效的UUID',
          'isOptional': '字段是可选的',
          'isIn': '值不在允许范围内',
        };

        // 优先使用自定义的中文消息
        const firstKey = Object.keys(constraints)[0];
        const message = chineseMessages[firstKey] || constraints[firstKey] || '验证失败';

        return new BadRequestException(message);
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Agent Task Management API')
    .setDescription('API documentation for Agent Task Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`
  🚀 Application is running!
  📝 API: http://localhost:${port}/${configService.get('API_PREFIX', 'api/v1')}
  📚 Docs: http://localhost:${port}/api/docs
  `);
}

bootstrap();
