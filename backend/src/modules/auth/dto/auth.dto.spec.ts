import { RegisterDto, LoginDto } from './auth.dto';

describe('Auth DTOs', () => {
  describe('RegisterDto', () => {
    it('should create a valid register DTO', () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.name = 'Test User';

      expect(dto.email).toBe('test@example.com');
      expect(dto.password).toBe('password123');
      expect(dto.name).toBe('Test User');
    });
  });

  describe('LoginDto', () => {
    it('should create a valid login DTO', () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      expect(dto.email).toBe('test@example.com');
      expect(dto.password).toBe('password123');
    });
  });
});
