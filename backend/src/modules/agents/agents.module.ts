import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ApiTokenService } from './services/api-token.service';
import { Agent } from './entities/agent.entity';
import { AgentStats } from './entities/agent-stats.entity';
import { ApiAccessLog } from './entities/api-access-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, AgentStats, ApiAccessLog])],
  controllers: [AgentsController],
  providers: [AgentsService, ApiTokenService],
  exports: [AgentsService, ApiTokenService],
})
export class AgentsModule {}
