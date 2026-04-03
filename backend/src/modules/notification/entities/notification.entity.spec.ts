import { Notification } from './notification.entity';
import { NotificationType } from '../../modules/notification/dto/notification.dto';

describe('Notification Entity', () => {
  it('should create a notification with all fields', () => {
    const notification = new Notification();
    notification.recipientId = 'user-1';
    notification.title = 'Test Notification';
    notification.content = 'Test Content';
    notification.isRead = false;

    expect(notification.recipientId).toBe('user-1');
    expect(notification.title).toBe('Test Notification');
    expect(notification.content).toBe('Test Content');
    expect(notification.isRead).toBe(false);
  });

  it('should have default values', () => {
    const notification = new Notification();

    expect(notification.isRead).toBe(false);
  });
});
