import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MechanicsService } from "./mechanics.service.js";
import { CreateMechanicDto, UpdateMechanicDto } from "./dto/mechanic.dto.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UserRole } from "../users/entities/user.entity.js";

@ApiTags("Mechanics")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("mechanics")
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Registrar un nuevo mecánico (ADMIN)" })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos los mecánicos" })
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Consultar mecánico por ID" })
  findOne(@Param("id") id: string) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Actualizar información del mecánico (ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(":id/toggle-status")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Activar o inactivar un mecánico (ADMIN)" })
  toggleStatus(@Param("id") id: string) {
    return this.mechanicsService.toggleStatus(id);
  }
}
