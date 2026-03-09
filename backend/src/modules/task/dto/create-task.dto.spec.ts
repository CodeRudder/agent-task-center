import { CreateTaskDto } from './create-task.dto';

describe('CreateTaskDto', () => {
  it('should create a valid task DTO', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Test Task';
    dto.description = 'Test Description';
    dto.status = 'pending';
    dto.priority = 'medium';
    dto.dueDate = new Date('2024-12-31');
    dto.assignedTo = 'user-001';
    dto.tags = ['tag1', 'tag2'];

    expect(dto.title).toBe('Test Task');
    expect(dto.description).toBe('Test Description');
    expect(dto.status).toBe('pending');
    expect(dto.priority).toBe('medium');
    expect(dto.dueDate).toBeInstanceOf(Date);
    expect(dto.assignedTo).toBe('user-001');
    expect(dto.tags).toEqual(['tag1', 'tag2']);
  });

  it('should allow optional fields', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Minimal Task';

    expect(dto.title).toBe('Minimal Task');
    expect(dto.description).toBeUndefined();
    expect(dto.status).toBeUndefined();
  });
});
