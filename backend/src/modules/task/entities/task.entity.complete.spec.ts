import { Task, TaskStatus, TaskPriority } from './task.entity';

describe('Task Entity', () => {
  it('should create a task with default values', () => {
    const task = new Task();
    task.title = 'Test';
    task.progress = 0;

    expect(task.progress).toBe(0);
  });

  it('should allow setting task properties', () => {
    const task = new Task();
    task.title = 'Test Task';
    task.description = 'Test Description';
    task.status = TaskStatus.IN_PROGRESS;
    task.priority = TaskPriority.HIGH;
    task.progress = 50;

    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test Description');
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    expect(task.priority).toBe(TaskPriority.HIGH);
    expect(task.progress).toBe(50);
  });

  it('should handle nullable fields', () => {
    const task = new Task();
    task.dueDate = new Date('2024-12-31');
    task.assigneeId = 'user-1';
    task.parentId = 'parent-1';
    task.metadata = { key: 'value' };

    expect(task.dueDate).toBeInstanceOf(Date);
    expect(task.assigneeId).toBe('user-1');
    expect(task.parentId).toBe('parent-1');
    expect(task.metadata).toEqual({ key: 'value' });
  });
});
