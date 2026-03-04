import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TaskModule } from './modules/task/task.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AgentsModule } from './modules/agents/agents.module';
import { TemplatesModule } from './modules/templates/templates.module';

// Common
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// Config
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['../.env', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature Modules
    AuthModule,
    UserModule,
    TaskModule,
    NotificationModule,
    AgentsModule,
    TemplatesModule,
  ],
  providers: [
    // Global Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global Guards - JWT Authentication
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
