import { TaskStatus } from './task.entity';

describe('TaskStatus Enum', () => {
  it('should have all status values', () => {
    expect(TaskStatus.TODO).toBe('todo');
    expect(TaskStatus.IN_PROGRESS).toBe('in_progress');
    expect(TaskStatus.REVIEW).toBe('review');
    expect(TaskStatus.DONE).toBe('done');
    expect(TaskStatus.BLOCKED).toBe('blocked');
  });

  it('should be usable in status transitions', () => {
    let status = TaskStatus.TODO;
    expect(status).toBe('todo');

    status = TaskStatus.IN_PROGRESS;
    expect(status).toBe('in_progress');

    status = TaskStatus.REVIEW;
    expect(status).toBe('review');

    status = TaskStatus.DONE;
    expect(status).toBe('done');

    status = TaskStatus.BLOCKED;
    expect(status).toBe('blocked');
  });

  it('should support comparisons', () => {
    const status = TaskStatus.IN_PROGRESS;
    expect(status).toBe('in_progress');
    expect(status).not.toBe(TaskStatus.TODO);
  });
});
