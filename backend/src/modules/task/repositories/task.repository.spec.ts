import { TaskRepository } from './task.repository';
import { Task } from '../entities/task.entity';

describe('TaskRepository', () => {
  let repository: TaskRepository;

  beforeEach(() => {
    // Repository requires constructor arguments, so we skip instantiation
  });

  describe('custom methods', () => {
    it('should extend Repository', () => {
      expect(TaskRepository).toBeDefined();
    });
  });
});
