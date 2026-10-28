import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * @Public() — Decorator that marks a route as public (no JWT required).
 * JwtAuthGuard checks this metadata to skip validation.
 * @example @Public() @Get('health') healthCheck() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
