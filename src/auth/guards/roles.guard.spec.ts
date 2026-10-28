import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { UserRole } from '../../users/entities/user.entity.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RolesGuard(mockReflector as Reflector);
  });

  const createMockContext = (user?: { role: UserRole }): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('should allow access if no roles are required on endpoint', () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext({ role: UserRole.TECHNICIAN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has one of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role is not authorized', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.TECHNICIAN });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not in request', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

