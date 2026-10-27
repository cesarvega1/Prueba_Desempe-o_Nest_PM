import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { VehicleStatus } from "../entities/vehicle.entity.js";

export class CreateVehicleDto {
  @ApiProperty({ example: "ABC-123", description: "Placa del vehículo (única)" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9\-]+$/, { message: "La placa solo puede contener letras, números y guiones" })
  plate: string;

  @ApiProperty({ example: "Toyota" })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: "Hilux" })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1900)
  year: number;

  @ApiProperty({ example: 45000, description: "Kilometraje actual" })
  @IsNumber()
  @Min(0)
  mileage: number;

  @ApiPropertyOptional({ enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
