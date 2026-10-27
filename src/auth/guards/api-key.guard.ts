import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Env } from "../../config/env.schema.js";

/**
 * ApiKeyGuard — Guard que valida la cabecera x-api-key para endpoints
 * destinados a integraciones externas. La clave se almacena en variables de entorno.
 * Úsalo como decorador a nivel de ruta: @UseGuards(ApiKeyGuard)
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<Env>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { "x-api-key"?: string };
    }>();

    const apiKey = request.headers["x-api-key"];
    const validApiKey = this.configService.get<string>("API_KEY");

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException("API Key inválida o no proporcionada");
    }

    return true;
  }
}
