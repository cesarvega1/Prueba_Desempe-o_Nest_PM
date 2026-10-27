import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { VehiclesService } from "./vehicles.service.js";
import { CreateVehicleDto, UpdateVehicleDto } from "./dto/vehicle.dto.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UserRole } from "../users/entities/user.entity.js";

@ApiTags("Vehicles")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /** Solo ADMIN puede registrar vehículos */
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Registrar un nuevo vehículo (ADMIN)" })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  /** Todos los usuarios autenticados pueden listar vehículos */
  @Get()
  @ApiOperation({ summary: "Listar todos los vehículos" })
  findAll() {
    return this.vehiclesService.findAll();
  }

  /** Buscar vehículo por placa */
  @Get("plate/:plate")
  @ApiOperation({ summary: "Consultar vehículo por placa" })
  @ApiParam({ name: "plate", description: "Placa del vehículo" })
  findByPlate(@Param("plate") plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  /** Buscar vehículo por ID */
  @Get(":id")
  @ApiOperation({ summary: "Consultar vehículo por ID" })
  findOne(@Param("id") id: string) {
    return this.vehiclesService.findOne(id);
  }

  /** Solo ADMIN puede actualizar */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Actualizar datos de un vehículo (ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  /** Inactivación lógica — no elimina registros */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Inactivar un vehículo (ADMIN) — eliminación lógica" })
  deactivate(@Param("id") id: string) {
    return this.vehiclesService.deactivate(id);
  }
}
