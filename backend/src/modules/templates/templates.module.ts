import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TaskTemplate } from './entities/task-template.entity';
import { Task } from '../task/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTemplate, Task])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
