import { TaskPriority } from './task.entity';

describe('TaskPriority Enum', () => {
  it('should have all priority levels', () => {
    expect(TaskPriority.LOW).toBe('low');
    expect(TaskPriority.MEDIUM).toBe('medium');
    expect(TaskPriority.HIGH).toBe('high');
    expect(TaskPriority.URGENT).toBe('urgent');
  });

  it('should be usable in comparisons', () => {
    const priority = TaskPriority.HIGH;
    expect(priority).toBe('high');
    expect(priority).not.toBe('low');
  });
});
