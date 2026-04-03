import { Test, TestingModule } from '@nestjs/testing';
import { TaskModule } from './task.module';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';

describe('TaskModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TaskModule],
    })
      .overrideProvider(TaskService)
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide TaskService', () => {
    const service = module.get<TaskService>(TaskService);
    expect(service).toBeDefined();
  });

  it('should provide TaskController', () => {
    const controller = module.get<TaskController>(TaskController);
    expect(controller).toBeDefined();
  });
});
