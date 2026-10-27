import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../users/entities/user.entity.js";

export class RegisterDto {
  @ApiProperty({ example: "Juan Pérez" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "juan@fleetcore.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "MiPassword123!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.TECHNICIAN })
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: "admin@fleetcore.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Admin12345!"})
  @IsString()
  @IsNotEmpty()
  password: string;

}
