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

  /** Only ADMIN can register vehicles */
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Registrar un nuevo vehículo (ADMIN)" })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  /** All authenticated users can list vehicles */
  @Get()
  @ApiOperation({ summary: "Listar todos los vehículos" })
  findAll() {
    return this.vehiclesService.findAll();
  }

  /** Search vehicle by plate */
  @Get("plate/:plate")
  @ApiOperation({ summary: "Consultar vehículo por placa" })
  @ApiParam({ name: "plate", description: "Placa del vehículo" })
  findByPlate(@Param("plate") plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  /** Search vehicle by ID */
  @Get(":id")
  @ApiOperation({ summary: "Consultar vehículo por ID" })
  findOne(@Param("id") id: string) {
    return this.vehiclesService.findOne(id);
  }

  /** Only ADMIN can update */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Actualizar datos de un vehículo (ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  /** Logical deactivation — does not delete records */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Inactivar un vehículo (ADMIN) — eliminación lógica" })
  deactivate(@Param("id") id: string) {
    return this.vehiclesService.deactivate(id);
  }
}
