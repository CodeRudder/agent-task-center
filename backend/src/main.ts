import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, NestModule } from '@nestjs/common';
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
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
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
