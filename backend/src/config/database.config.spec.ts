import { databaseConfig } from './database.config';

describe('Database Config', () => {
  it('should return database configuration', () => {
    const config = databaseConfig();

    expect(config).toBeDefined();
    expect(config.type).toBe('mysql');
    expect(config.host).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.username).toBeDefined();
    expect(config.database).toBeDefined();
  });

  it('should return port as number', () => {
    const config = databaseConfig();

    expect(typeof config.port).toBe('number');
    expect(config.port).toBeGreaterThan(0);
  });

  it('should have default values', () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;

    const config = databaseConfig();

    expect(config.host).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.username).toBeDefined();
  });
});
