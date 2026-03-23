import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './services/task.service';
import { TaskStatusMachineService } from './services/task-status-machine.service';
import { TaskController } from './task.controller';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { SubtaskService } from './services/subtask.service';
import { SubtaskController } from './controllers/subtask.controller';
import { TaskDependencyService } from './services/task-dependency.service';
import { TaskDependencyController } from './controllers/task-dependency.controller';
import { CommentModule } from '../comment/comment.module';
import { Vote } from '../vote/vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Subtask, TaskDependency, TaskStatusHistory, Vote]),
    CommentModule,
  ],
  controllers: [TaskController, SubtaskController, TaskDependencyController],
  providers: [TaskService, TaskStatusMachineService, SubtaskService, TaskDependencyService],
  exports: [TaskService, TaskStatusMachineService, SubtaskService, TaskDependencyService],
})
export class TaskModule {}
