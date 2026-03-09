import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard - Complete Coverage', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('canActivate', () => {
    it('should allow access with valid user', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({ user: { id: 'user-1' } }),
        }),
      } as any;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access without user', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => ({}),
        }),
      } as any;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });
  });
});
