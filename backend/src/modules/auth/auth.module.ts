import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AgentAuthController } from './agent-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ApiTokenGuard } from './guards/api-token.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { User } from '../user/entities/user.entity';
import { AgentsModule } from '../agents/agents.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiration', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    AgentsModule,
  ],
  controllers: [AuthController, AgentAuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, ApiTokenGuard, PermissionsGuard],
  exports: [AuthService, JwtModule, ApiTokenGuard, PermissionsGuard],
})
export class AuthModule {}
