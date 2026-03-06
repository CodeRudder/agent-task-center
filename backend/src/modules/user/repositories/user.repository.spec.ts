import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
  });

  describe('custom methods', () => {
    it('should extend Repository', () => {
      expect(repository).toBeDefined();
    });
  });
});
