import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockReflector: any;

  beforeEach(() => {
    mockJwtService = {
      verifyAsync: vi.fn(),
    };
    mockConfigService = {
      get: vi.fn().mockReturnValue('secret123'),
    };
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new JwtAuthGuard(
      mockJwtService as JwtService,
      mockConfigService as ConfigService,
      mockReflector as Reflector,
    );
  });

  const createMockContext = (authorizationHeader?: string): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authorizationHeader ? { authorization: authorizationHeader } : {},
          user: null,
        }),
      }),
    } as any;
  };

  it('should allow access if route is marked as @Public()', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if no token is provided', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should attach user payload to request if token is valid', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'user-1', email: 'test@fleetcore.com' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);

    const req: any = {
      headers: { authorization: 'Bearer valid.jwt.token' },
      user: null,
    };
    const context: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    };

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req.user).toEqual(payload);
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));
    const context = createMockContext('Bearer invalid.token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});

