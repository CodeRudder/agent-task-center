import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { Agent } from './entities/agent.entity';
import { AgentStats } from './entities/agent-stats.entity';
import { ApiAccessLog } from './entities/api-access-log.entity';
import { ApiTokenService } from './services/api-token.service';
import { Task } from '../task/entities/task.entity';
import { AdminRegenerateTokenController } from './admin/admin-regenerate-token.controller';
import { AdminRevokeTokenController } from './admin/admin-revoke-token.controller';
import { VerifyController } from './auth/verify.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, AgentStats, ApiAccessLog, Task])],
  controllers: [
    AgentsController,
    AdminRegenerateTokenController,
    AdminRevokeTokenController,
    VerifyController,
  ],
  providers: [AgentsService, ApiTokenService],
  exports: [AgentsService, ApiTokenService],
})
export class AgentsModule {}
