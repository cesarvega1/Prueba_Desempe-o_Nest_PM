import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('should format successful response with success, statusCode, data, and timestamp', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ message: 'OK' }),
    };

    const observable = interceptor.intercept(mockContext, mockCallHandler);

    return new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: (result) => {
          try {
            expect(result.success).toBe(true);
            expect(result.statusCode).toBe(200);
            expect(result.data).toEqual({ message: 'OK' });
            expect(result.timestamp).toBeDefined();
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        error: reject,
      });
    });
  });
});

