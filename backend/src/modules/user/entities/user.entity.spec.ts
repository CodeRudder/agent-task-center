import { User } from './user.entity';

describe('User Entity', () => {
  it('should create a user instance', () => {
    const user = new User();
    user.id = 'user-001';
    user.email = 'test@example.com';
    user.password = 'hashedpassword';
    user.displayName = 'Test User';
    user.role = 'user';
    user.isActive = true;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    expect(user.id).toBe('user-001');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('hashedpassword');
    expect(user.displayName).toBe('Test User');
    expect(user.role).toBe('user');
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('should have default values', () => {
    const user = new User();

    // Check that user object is created
    expect(user).toBeDefined();
    expect(user.feishuOpenId).toBeUndefined();
  });

  it('should support optional fields', () => {
    const user = new User();
    user.id = 'user-002';
    user.email = 'minimal@example.com';
    user.password = 'password123';
    user.displayName = 'Minimal User';
    user.feishuOpenId = 'feishu-123';
    user.avatarUrl = 'https://example.com/avatar.png';

    expect(user.feishuOpenId).toBe('feishu-123');
    expect(user.avatarUrl).toBe('https://example.com/avatar.png');
  });
});
