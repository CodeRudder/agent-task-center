import { CreateTaskDto } from './task.dto';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

describe('CreateTaskDto', () => {
  it('should create a valid task DTO', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Test Task';
    dto.description = 'Test Description';
    dto.status = TaskStatus.TODO;
    dto.priority = TaskPriority.MEDIUM;
    dto.assigneeId = 'user-001';

    expect(dto.title).toBe('Test Task');
    expect(dto.description).toBe('Test Description');
    expect(dto.status).toBe(TaskStatus.TODO);
    expect(dto.priority).toBe(TaskPriority.MEDIUM);
    expect(dto.assigneeId).toBe('user-001');
  });

  it('should allow optional fields', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Minimal Task';

    expect(dto.title).toBe('Minimal Task');
    expect(dto.description).toBeUndefined();
    expect(dto.status).toBeUndefined();
  });
});
