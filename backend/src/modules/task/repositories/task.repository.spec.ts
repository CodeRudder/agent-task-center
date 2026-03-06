import { TaskRepository } from '../repositories/task.repository';
import { Task } from '../entities/task.entity';

describe('TaskRepository', () => {
  let repository: TaskRepository;

  beforeEach(() => {
    repository = new TaskRepository();
  });

  describe('custom methods', () => {
    it('should extend Repository', () => {
      expect(repository).toBeDefined();
    });
  });
});
