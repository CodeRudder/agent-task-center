import { Task } from './task.entity';
import { TaskStatus, TaskPriority } from './task.entity';

describe('Task Entity', () => {
  it('should create a task instance', () => {
    const task = new Task();
    task.id = 'task-001';
    task.title = 'Test Task';
    task.description = 'Test Description';
    task.status = TaskStatus.TODO;
    task.priority = TaskPriority.MEDIUM;
    task.createdAt = new Date();
    task.updatedAt = new Date();

    expect(task.id).toBe('task-001');
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test Description');
    expect(task.status).toBe(TaskStatus.TODO);
    expect(task.priority).toBe(TaskPriority.MEDIUM);
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('should have default values', () => {
    const task = new Task();

    expect(task.status).toBeUndefined();
    expect(task.priority).toBeUndefined();
  });

  it('should support optional fields', () => {
    const task = new Task();
    task.id = 'task-002';
    task.title = 'Minimal Task';
    task.dueDate = null;
    task.assigneeId = null;

    expect(task.dueDate).toBeNull();
    expect(task.assigneeId).toBeNull();
  });
});
