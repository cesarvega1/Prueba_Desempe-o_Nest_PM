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
 * RolesGuard — Guard that validates the user has the required role.
 * Relies on the @Roles() decorator to determine which roles have access.
 * Must be used AFTER JwtAuthGuard (which attaches the user to the request).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Required roles declared with @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are declared, the route is open to any authenticated user
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
