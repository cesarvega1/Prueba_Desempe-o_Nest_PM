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
import { WorkshopsService } from "./workshops.service.js";
import { CreateWorkshopDto, UpdateWorkshopDto } from "./dto/workshop.dto.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UserRole } from "../users/entities/user.entity.js";

@ApiTags("Workshops")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller("workshops")
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Registrar un nuevo taller (ADMIN)" })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos los talleres" })
  findAll() {
    return this.workshopsService.findAll();
  }

  @Get("active")
  @ApiOperation({ summary: "Listar talleres activos" })
  findActive() {
    return this.workshopsService.findActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Consultar taller por ID" })
  findOne(@Param("id") id: string) {
    return this.workshopsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Actualizar información de un taller (ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(":id/toggle-status")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Activar o inactivar un taller (ADMIN)" })
  toggleStatus(@Param("id") id: string) {
    return this.workshopsService.toggleStatus(id);
  }
}
