import { redisConfig } from './redis.config';

describe('Redis Config', () => {
  it('should return redis configuration object', () => {
    const config = redisConfig();

    expect(config).toBeDefined();
    expect(config).toHaveProperty('host');
    expect(config).toHaveProperty('port');
  });

  it('should return port as number', () => {
    const config = redisConfig();

    expect(typeof config.port).toBe('number');
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
  });

  it('should have host defined', () => {
    const config = redisConfig();

    expect(config.host).toBeDefined();
    expect(typeof config.host).toBe('string');
  });

  it('should support optional password', () => {
    const config = redisConfig();

    expect(config).toHaveProperty('password');
  });
});
