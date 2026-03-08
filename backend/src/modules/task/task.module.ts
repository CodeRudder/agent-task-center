import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { SubtaskService } from './services/subtask.service';
import { SubtaskController } from './controllers/subtask.controller';
import { TaskDependencyService } from './services/task-dependency.service';
import { TaskDependencyController } from './controllers/task-dependency.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Subtask, TaskDependency])],
  controllers: [TaskController, SubtaskController, TaskDependencyController],
  providers: [TaskService, SubtaskService, TaskDependencyService],
  exports: [TaskService, SubtaskService, TaskDependencyService],
})
export class TaskModule {}
