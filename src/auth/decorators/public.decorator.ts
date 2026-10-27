import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * @Public() — Decorador que marca una ruta como pública (no requiere JWT).
 * El JwtAuthGuard comprueba este metadato para saltar la validación.
 * @example @Public() @Get('health') healthCheck() {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
