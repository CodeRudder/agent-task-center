import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskService } from "./services/task.service";
import { TaskStatusMachineService } from "./services/task-status-machine.service";
import { TaskController } from "./task.controller";
import { Task } from "./entities/task.entity";
import { TaskStatusHistory } from "./entities/task-status-history.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskStatusHistory])],
  controllers: [TaskController],
  providers: [TaskService, TaskStatusMachineService],
  exports: [TaskService, TaskStatusMachineService],
})
export class TaskModule {}
