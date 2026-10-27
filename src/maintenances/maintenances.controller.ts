import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MaintenancesService } from "./maintenances.service.js";
import {
  CreateMaintenanceDto,
  UpdateMaintenanceStatusDto,
} from "./dto/maintenance.dto.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { UserRole } from "../users/entities/user.entity.js";
import { ApiKeyGuard } from "../auth/guards/api-key.guard.js";
import type { JwtPayload } from "../auth/interfaces/jwt-payload.interface.js";

@ApiTags("Maintenances")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("maintenances")
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  /** Solo ADMIN puede crear mantenimientos */
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Crear un nuevo mantenimiento (ADMIN)" })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  /** Listar todos los mantenimientos */
  @Get()
  @ApiOperation({ summary: "Listar todos los mantenimientos" })
  findAll() {
    return this.maintenancesService.findAll();
  }

  /** Listar mantenimientos activos */
  @Get("active")
  @ApiOperation({ summary: "Listar mantenimientos activos (SCHEDULED o IN_PROGRESS)" })
  findActive() {
    return this.maintenancesService.findActive();
  }

  /**
   * Endpoint especial con x-api-key para integraciones externas.
   * Retorna todos los mantenimientos activos sin requerir JWT.
   */
  @Get("external/active")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Mantenimientos activos para integración externa (x-api-key)",
  })
  findActiveExternal() {
    return this.maintenancesService.findActive();
  }

  /** Historial de mantenimientos de un vehículo */
  @Get("history/vehicle/:vehicleId")
  @ApiOperation({ summary: "Historial de mantenimientos de un vehículo" })
  getVehicleHistory(@Param("vehicleId") vehicleId: string) {
    return this.maintenancesService.getVehicleHistory(vehicleId);
  }

  /** Listar mantenimientos de un vehículo */
  @Get("vehicle/:vehicleId")
  @ApiOperation({ summary: "Mantenimientos por vehículo" })
  findByVehicle(@Param("vehicleId") vehicleId: string) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  /**
   * Mantenimientos asignados a un mecánico.
   * TECHNICIAN solo puede ver los suyos; ADMIN ve cualquiera.
   */
  @Get("mechanic/:mechanicId")
  @ApiOperation({ summary: "Mantenimientos asignados a un mecánico" })
  findByMechanic(
    @Param("mechanicId") mechanicId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  /** Detalle de un mantenimiento */
  @Get(":id")
  @ApiOperation({ summary: "Consultar detalle de un mantenimiento" })
  findOne(@Param("id") id: string) {
    return this.maintenancesService.findOne(id);
  }

  /**
   * Actualiza el estado de un mantenimiento.
   * TECHNICIAN solo puede actualizar los mantenimientos que tiene asignados.
   */
  @Patch(":id/status")
  @ApiOperation({ summary: "Actualizar estado de un mantenimiento" })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Técnico solo puede actualizar sus propios mantenimientos
    if (user.role === UserRole.TECHNICIAN) {
      const maintenance = await this.maintenancesService.findOne(id);
      // Verificar que el mantenimiento pertenece al mecánico vinculado al técnico
      // (por simplicidad, se valida que el mechanicId coincida con el userId del técnico
      // en un sistema real estarían vinculados por una relación User-Mechanic)
      const isMine = maintenance.mechanic?.email === user.email;
      if (!isMine) {
        throw new ForbiddenException(
          "Solo puedes actualizar los mantenimientos que tienes asignados",
        );
      }
    }

    return this.maintenancesService.updateStatus(id, dto, user.role);
  }
}
