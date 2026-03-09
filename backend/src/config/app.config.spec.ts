import { appConfig } from './app.config';

describe('App Config', () => {
  it('should return app configuration', () => {
    const config = appConfig();

    expect(config).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
    expect(config.port).toBeDefined();
  });

  it('should return port as number', () => {
    const config = appConfig();

    expect(typeof config.port).toBe('number');
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
  });

  it('should have default port', () => {
    delete process.env.PORT;
    const config = appConfig();

    expect(config.port).toBe(3000);
  });
});
