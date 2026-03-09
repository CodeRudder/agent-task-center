import { TaskStatus } from './task.entity';

describe('TaskStatus Enum', () => {
  it('should have all status values', () => {
    expect(TaskStatus.TODO).toBe('TODO');
    expect(TaskStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(TaskStatus.REVIEW).toBe('REVIEW');
    expect(TaskStatus.DONE).toBe('DONE');
  });

  it('should be usable in status transitions', () => {
    let status = TaskStatus.TODO;
    expect(status).toBe('TODO');

    status = TaskStatus.IN_PROGRESS;
    expect(status).toBe('IN_PROGRESS');

    status = TaskStatus.REVIEW;
    expect(status).toBe('REVIEW');

    status = TaskStatus.DONE;
    expect(status).toBe('DONE');
  });

  it('should support string comparisons', () => {
    const status = TaskStatus.IN_PROGRESS;
    expect(status === 'IN_PROGRESS').toBe(true);
    expect(status === 'TODO').toBe(false);
  });
});
