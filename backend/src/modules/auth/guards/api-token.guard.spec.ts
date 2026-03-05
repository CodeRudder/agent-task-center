import { Test, TestingModule } from '@nestjs/testing';
import { ApiTokenGuard } from './api-token.guard';
import { ApiTokenService } from '../../agents/services/api-token.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('ApiTokenGuard', () => {
  let guard: ApiTokenGuard;
  let apiTokenService: ApiTokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiTokenGuard,
        {
          provide: ApiTokenService,
          useValue: {
            validateApiToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    guard = module.get<ApiTokenGuard>(ApiTokenGuard);
    apiTokenService = module.get<ApiTokenService>(ApiTokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should reject request without authorization header', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as any;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should validate API token successfully', async () => {
      const mockPayload = {
        agentId: 'test-agent-id',
        agentName: 'Test Agent',
        role: 'worker_agent',
      };

      jest.spyOn(apiTokenService, 'validateApiToken').mockResolvedValue(mockPayload);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer agt_test_token',
            },
          }),
        }),
      } as any;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });
});
