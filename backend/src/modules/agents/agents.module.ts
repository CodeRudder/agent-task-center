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
import { GetTasksController } from './tasks/get-tasks.controller';
import { GetTaskDetailsController } from './tasks/get-task-details.controller';
import { UpdateProgressController } from './tasks/update-progress.controller';
import { StartTaskController } from './tasks/start-task.controller';
import { CompleteTaskController } from './tasks/complete-task.controller';
import { BlockTaskController } from './tasks/block-task.controller';
import { UnblockTaskController } from './tasks/unblock-task.controller';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AgentStats, ApiAccessLog, Task]),
    TaskModule,
  ],
  controllers: [
    AgentsController,
    AdminRegenerateTokenController,
    AdminRevokeTokenController,
    VerifyController,
    GetTasksController,
    GetTaskDetailsController,
    UpdateProgressController,
    StartTaskController,
    CompleteTaskController,
    BlockTaskController,
    UnblockTaskController,
  ],
  providers: [AgentsService, ApiTokenService],
  exports: [AgentsService, ApiTokenService],
})
export class AgentsModule {}
