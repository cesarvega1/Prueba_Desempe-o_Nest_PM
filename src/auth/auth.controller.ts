import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { LoginDto, RegisterDto } from "./dto/auth.dto.js";
import { Public } from "./decorators/public.decorator.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import type { JwtPayload } from "./interfaces/jwt-payload.interface.js";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Registro de nuevos usuarios (ruta pública) */
  @Public()
  @Post("register")
  @ApiOperation({ summary: "Registro de usuario nuevo" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** Inicio de sesión (ruta pública) */
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Inicio de sesión con email y contraseña" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Perfil del usuario autenticado */
  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener perfil del usuario autenticado" })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
