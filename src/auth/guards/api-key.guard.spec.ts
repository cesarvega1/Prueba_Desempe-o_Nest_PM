import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard.js';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'API_KEY') return 'valid-secret-key-12345';
        return null;
      }),
    };
    guard = new ApiKeyGuard(mockConfigService);
  });

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as any;
  };

  it('should allow access when valid x-api-key header is provided', () => {
    const context = createMockContext({ 'x-api-key': 'valid-secret-key-12345' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when x-api-key header is missing', () => {
    const context = createMockContext({});
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when x-api-key header is invalid', () => {
    const context = createMockContext({ 'x-api-key': 'wrong-key' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});

