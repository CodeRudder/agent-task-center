import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { SubtaskController, GetSubtasksController, UpdateSubtaskController, DeleteSubtaskController, UpdateProgressController } from './controllers/subtask.controllers';
import { SubtaskService } from './services/subtask.service';
import { CreateTaskDependencyController, GetTaskDependenciesController, UpdateTaskDependencyController, DeleteTaskDependencyController, ResolveTaskDependencyController } from './controllers/task-dependencies.controllers';
import { TaskDependenciesService } from './services/task-dependencies.service';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { User } from '../user/entities/user.entity';
import { Agent } from '../agents/entities/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Subtask, TaskDependency, User, Agent]),
  ],
  controllers: [
    TaskController,
    SubtaskController,
    GetSubtasksController,
    UpdateSubtaskController,
    DeleteSubtaskController,
    UpdateProgressController,
    CreateTaskDependencyController,
    GetTaskDependenciesController,
    UpdateTaskDependencyController,
    DeleteTaskDependencyController,
    ResolveTaskDependencyController,
  ],
  providers: [
    TaskService,
    SubtaskService,
    TaskDependenciesService,
  ],
  exports: [TaskService],
})
export class TaskModule {}
