import { Task } from './task.entity';

describe('Task Entity', () => {
  it('should create a task instance', () => {
    const task = new Task();
    task.id = 'task-001';
    task.title = 'Test Task';
    task.description = 'Test Description';
    task.status = 'pending';
    task.priority = 'medium';
    task.createdAt = new Date();
    task.updatedAt = new Date();

    expect(task.id).toBe('task-001');
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test Description');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('should have default values', () => {
    const task = new Task();

    expect(task.status).toBeUndefined();
    expect(task.priority).toBeUndefined();
    expect(task.isCompleted).toBe(false);
  });

  it('should support optional fields', () => {
    const task = new Task();
    task.id = 'task-002';
    task.title = 'Minimal Task';
    task.dueDate = null;
    task.assignedTo = null;

    expect(task.dueDate).toBeNull();
    expect(task.assignedTo).toBeNull();
  });
});
