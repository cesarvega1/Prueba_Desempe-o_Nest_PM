import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { Env } from "../../config/env.schema.js";

/**
 * JwtAuthGuard — Guard global que valida el JWT en todas las rutas privadas.
 * Las rutas marcadas con @Public() quedan exentas de esta validación.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Si la ruta está marcada como pública, se omite la validación
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user: unknown;
    }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Token no proporcionado");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get("JWT_SECRET"),
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    return true;
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string };
  }): string | null {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? (token ?? null) : null;
  }
}
