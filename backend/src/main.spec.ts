import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Main Bootstrap', () => {
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      use: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockResolvedValue('http://localhost:3000'),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create application', async () => {
    const { NestFactory } = require('@nestjs/core');
    const app = await NestFactory.create(AppModule);

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(app).toBeDefined();
  });

  it('should use validation pipe', async () => {
    const app = await NestFactory.create(AppModule);
    app.use(new ValidationPipe());

    expect(app.use).toHaveBeenCalled();
  });

  it('should listen on port', async () => {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);

    expect(app.listen).toHaveBeenCalledWith(3000);
  });
});
