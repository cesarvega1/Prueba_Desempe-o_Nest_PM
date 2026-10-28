import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Env } from "../../config/env.schema.js";

/**
 * ApiKeyGuard — Guard that validates the x-api-key header for endpoints
 * intended for external integrations. The key is stored in environment variables.
 * Use it as a route-level decorator: @UseGuards(ApiKeyGuard)
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
