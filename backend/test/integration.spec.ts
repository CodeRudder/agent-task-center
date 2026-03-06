import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  describe('Auth Endpoints', () => {
    it('/auth/register (POST) - should register new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123!@#',
        })
        .expect(201);
    });

    it('/auth/login (POST) - should login user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!@#',
        })
        .expect(201);
    });
  });

  describe('Task Endpoints', () => {
    it('/tasks (GET) - should return tasks list', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .expect(200);
    });

    it('/tasks (POST) - should create task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'New Task',
          description: 'Task description',
          status: 'pending',
          priority: 'medium',
        })
        .expect(201);
    });
  });
});
