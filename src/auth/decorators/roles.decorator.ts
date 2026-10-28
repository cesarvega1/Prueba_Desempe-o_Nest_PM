import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../users/entities/user.entity.js";

export const ROLES_KEY = "roles";

/**
 * @Roles() — Decorator that declares which roles can access an endpoint.
 * Use it together with RolesGuard.
 * @example @Roles(UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
