import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  MaintenanceStatus,
  MaintenanceType,
} from "../entities/maintenance.entity.js";

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: "Cambio de aceite y filtros" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45000, description: "Kilometraje al registrar el mantenimiento" })
  @IsNumber()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: "2024-08-15T08:00:00.000Z", description: "Fecha programada de inicio" })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ example: "2024-08-15T10:00:00.000Z", description: "Fecha estimada de finalización (para control de solapamiento)" })
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: string;

  @ApiProperty({ example: "uuid-del-vehiculo" })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: "uuid-del-mecanico" })
  @IsUUID()
  mechanicId: string;

  @ApiProperty({ example: "uuid-del-taller" })
  @IsUUID()
  workshopId: string;
}

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, description: "Nuevo estado del mantenimiento" })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  // ─── Campos obligatorios al COMPLETAR ───────────────────────────────────────

  @ApiPropertyOptional({ example: "Se realizó cambio de aceite 5W30, filtro de aceite y filtro de aire" })
  @IsOptional()
  @IsString()
  workDone?: string;

  @ApiPropertyOptional({ example: 350000, description: "Costo final en pesos" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalCost?: number;

  @ApiPropertyOptional({ example: "2024-08-15T09:45:00.000Z" })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ example: 45250, description: "Kilometraje final del vehículo" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalMileage?: number;
}
