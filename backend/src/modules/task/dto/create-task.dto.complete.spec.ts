import { CreateTaskDto } from './task.dto';

describe('CreateTaskDto', () => {
  it('should create a valid DTO', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Test Task';
    dto.description = 'Test Description';
    dto.priority = 'high';

    expect(dto.title).toBe('Test Task');
    expect(dto.description).toBe('Test Description');
    expect(dto.priority).toBe('high');
  });

  it('should have optional fields', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Minimal Task';

    expect(dto.title).toBe('Minimal Task');
    expect(dto.description).toBeUndefined();
    expect(dto.assigneeId).toBeUndefined();
  });
});
