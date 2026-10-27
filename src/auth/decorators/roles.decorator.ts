import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../users/entities/user.entity.js";

export const ROLES_KEY = "roles";

/**
 * @Roles() — Decorador que declara qué roles tienen acceso a un endpoint.
 * Úsalo junto con el RolesGuard.
 * @example @Roles(UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
