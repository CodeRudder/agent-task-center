import { Notification } from './entities/notification.entity';

describe('Notification Entity', () => {
  it('should create a notification with all fields', () => {
    const notification = new Notification();
    notification.userId = 'user-1';
    notification.title = 'Test Notification';
    notification.content = 'Test Content';
    notification.isRead = false;

    expect(notification.userId).toBe('user-1');
    expect(notification.title).toBe('Test Notification');
    expect(notification.content).toBe('Test Content');
    expect(notification.isRead).toBe(false);
  });

  it('should have default values', () => {
    const notification = new Notification();

    expect(notification.isRead).toBe(false);
  });
});
