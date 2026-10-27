import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import { UserRole } from "../../users/entities/user.entity.js";

/**
 * RolesGuard — Guard que valida que el usuario tenga el rol requerido.
 * Se apoya en el decorador @Roles() para determinar qué roles tienen acceso.
 * Debe usarse DESPUÉS del JwtAuthGuard (que ya adjunta el usuario al request).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Roles requeridos declarados con @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se declararon roles, la ruta está abierta a cualquier usuario autenticado
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      user: { role: UserRole };
    }>();

    const { user } = request;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        "No tienes permisos suficientes para acceder a este recurso",
      );
    }

    return true;
  }
}
