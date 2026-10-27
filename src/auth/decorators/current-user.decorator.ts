import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "../interfaces/jwt-payload.interface.js";

/**
 * @CurrentUser() — Decorador de parámetro que extrae el usuario autenticado
 * del request (payload del JWT). Requiere que JwtAuthGuard haya sido aplicado primero.
 * @example async getProfile(@CurrentUser() user: JwtPayload) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
