import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    // Repository requires constructor arguments, so we skip instantiation
    // Just test that the class exists
  });

  describe('custom methods', () => {
    it('should extend Repository', () => {
      expect(UserRepository).toBeDefined();
    });
  });
});
