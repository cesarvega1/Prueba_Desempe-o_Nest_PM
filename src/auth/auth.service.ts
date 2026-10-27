import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { User, UserRole } from "../users/entities/user.entity.js";
import { LoginDto, RegisterDto } from "./dto/auth.dto.js";
import { Env } from "../config/env.schema.js";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env>,
  ) { }

  /** Registra un nuevo usuario con contraseña hasheada (Argon2) */
  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException(
        `Ya existe un usuario con el correo ${dto.email}`,
      );
    }

    // Hash seguro con bcrypt (factor 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role ?? UserRole.TECHNICIAN,
    });

    const saved = await this.userRepo.save(user);

    // No retornamos el hash de la contraseña
    const { password: _pw, ...result } = saved;
    return result;
  }

  /** Autentica un usuario y retorna un JWT */
  async login(dto: LoginDto) {
    // addSelect para obtener el campo password (está excluido por defecto)
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Usuario inactivo");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get("JWT_SECRET"),
      expiresIn: this.configService.get("JWT_EXPIRES_IN"),
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /** Retorna el perfil del usuario autenticado */
  async getProfile(userId: string) {
    return this.userRepo.findOne({ where: { id: userId } });
  }
}
