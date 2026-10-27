import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Maintenance,
  MaintenanceStatus,
} from "./entities/maintenance.entity.js";
import {
  CreateMaintenanceDto,
  UpdateMaintenanceStatusDto,
} from "./dto/maintenance.dto.js";
import { VehiclesService } from "../vehicles/vehicles.service.js";
import { MechanicsService } from "../mechanics/mechanics.service.js";
import { WorkshopsService } from "../workshops/workshops.service.js";
import { VehicleStatus } from "../vehicles/entities/vehicle.entity.js";
import { MechanicStatus } from "../mechanics/entities/mechanic.entity.js";
import { WorkshopStatus } from "../workshops/entities/workshop.entity.js";

/** Mapa de transiciones de estado válidas */
const VALID_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.SCHEDULED]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.IN_PROGRESS]: [
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.COMPLETED]: [], // Estado final — no permite regresión
  [MaintenanceStatus.CANCELLED]: [], // Estado final — no se puede retomar
};

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepo: Repository<Maintenance>,
    private readonly vehiclesService: VehiclesService,
    private readonly mechanicsService: MechanicsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    // ─── Validar vehículo ──────────────────────────────────────────────────────
    const vehicle = await this.vehiclesService.findOne(dto.vehicleId);
    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new BadRequestException(
        "No se puede crear un mantenimiento para un vehículo INACTIVE",
      );
    }

    // Vehículo no puede tener más de un mantenimiento activo simultáneo
    const activeVehicleMaintenance = await this.maintenanceRepo.findOne({
      where: [
        { vehicleId: dto.vehicleId, status: MaintenanceStatus.SCHEDULED },
        { vehicleId: dto.vehicleId, status: MaintenanceStatus.IN_PROGRESS },
      ],
    });
    if (activeVehicleMaintenance) {
      throw new ConflictException(
        "Este vehículo ya tiene un mantenimiento activo (SCHEDULED o IN_PROGRESS)",
      );
    }

    // ─── Validar mecánico ──────────────────────────────────────────────────────
    const mechanic = await this.mechanicsService.findOne(dto.mechanicId);
    if (mechanic.status === MechanicStatus.INACTIVE) {
      throw new BadRequestException(
        "No se puede asignar un mecánico INACTIVE a un mantenimiento",
      );
    }

    // Control de solapamiento de horarios del mecánico
    await this.checkMechanicScheduleConflict(
      dto.mechanicId,
      new Date(dto.scheduledDate),
      dto.estimatedEndDate ? new Date(dto.estimatedEndDate) : null,
    );

    // ─── Validar taller ────────────────────────────────────────────────────────
    const workshop = await this.workshopsService.findOne(dto.workshopId);
    if (workshop.status === WorkshopStatus.INACTIVE) {
      throw new BadRequestException(
        "No se puede asignar un taller INACTIVE a un mantenimiento",
      );
    }

    // ─── Validar kilometraje ───────────────────────────────────────────────────
    if (dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        `El kilometraje del mantenimiento (${dto.mileage}) no puede ser inferior al kilometraje actual del vehículo (${vehicle.mileage})`,
      );
    }

    const maintenance = this.maintenanceRepo.create({
      ...dto,
      scheduledDate: new Date(dto.scheduledDate),
      estimatedEndDate: dto.estimatedEndDate
        ? new Date(dto.estimatedEndDate)
        : null,
      status: MaintenanceStatus.SCHEDULED,
    });

    return this.maintenanceRepo.save(maintenance);
  }

  findAll(): Promise<Maintenance[]> {
    return this.maintenanceRepo.find({ order: { scheduledDate: "DESC" } });
  }

  findActive(): Promise<Maintenance[]> {
    return this.maintenanceRepo.find({
      where: [
        { status: MaintenanceStatus.SCHEDULED },
        { status: MaintenanceStatus.IN_PROGRESS },
      ],
      order: { scheduledDate: "ASC" },
    });
  }

  async findOne(id: string): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepo.findOne({ where: { id } });
    if (!maintenance) {
      throw new NotFoundException(`Mantenimiento con id ${id} no encontrado`);
    }
    return maintenance;
  }

  async findByVehicle(vehicleId: string): Promise<Maintenance[]> {
    await this.vehiclesService.findOne(vehicleId); // Verifica que existe
    return this.maintenanceRepo.find({
      where: { vehicleId },
      order: { scheduledDate: "DESC" },
    });
  }

  async findByMechanic(mechanicId: string): Promise<Maintenance[]> {
    await this.mechanicsService.findOne(mechanicId); // Verifica que existe
    return this.maintenanceRepo.find({
      where: { mechanicId },
      order: { scheduledDate: "DESC" },
    });
  }

  /** Historial completo de mantenimientos de un vehículo */
  async getVehicleHistory(vehicleId: string): Promise<Maintenance[]> {
    await this.vehiclesService.findOne(vehicleId);
    return this.maintenanceRepo.find({
      where: { vehicleId, status: MaintenanceStatus.COMPLETED },
      order: { completedAt: "DESC" },
    });
  }

  /**
   * Actualiza el estado de un mantenimiento respetando las reglas de negocio.
   * Al pasar a IN_PROGRESS → vehículo pasa a IN_MAINTENANCE.
   * Al pasar a COMPLETED → vehículo vuelve a AVAILABLE.
   */
  async updateStatus(
    id: string,
    dto: UpdateMaintenanceStatusDto,
    userRole: string,
  ): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    const currentStatus = maintenance.status;
    const newStatus = dto.status;

    // Verificar transición válida
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transición inválida: no se puede cambiar de ${currentStatus} a ${newStatus}`,
      );
    }

    // Técnico solo puede actualizar mantenimientos que tiene asignados
    // (validación de rol extendida que se hace en el controller para el técnico)

    // Al COMPLETAR se requiere información de cierre
    if (newStatus === MaintenanceStatus.COMPLETED) {
      const { workDone, finalCost, completedAt, finalMileage } = dto;
      if (!workDone || finalCost === undefined || !completedAt || finalMileage === undefined) {
        throw new BadRequestException(
          "Para completar un mantenimiento se requiere: workDone, finalCost, completedAt y finalMileage",
        );
      }

      // El kilometraje final no puede ser menor al del vehículo
      const vehicle = await this.vehiclesService.findOne(maintenance.vehicleId);
      if (finalMileage < vehicle.mileage) {
        throw new BadRequestException(
          `El kilometraje final (${finalMileage}) no puede ser menor al kilometraje actual del vehículo (${vehicle.mileage})`,
        );
      }

      maintenance.workDone = workDone;
      maintenance.finalCost = finalCost;
      maintenance.completedAt = new Date(completedAt);
      maintenance.finalMileage = finalMileage;

      // Actualizar kilometraje del vehículo y su estado
      await this.vehiclesService.update(maintenance.vehicleId, {
        mileage: finalMileage,
        status: VehicleStatus.AVAILABLE,
      });
    }

    if (newStatus === MaintenanceStatus.IN_PROGRESS) {
      // El vehículo pasa a IN_MAINTENANCE
      await this.vehiclesService.updateStatus(
        maintenance.vehicleId,
        VehicleStatus.IN_MAINTENANCE,
      );
    }

    if (newStatus === MaintenanceStatus.CANCELLED) {
      // Si estaba IN_PROGRESS el vehículo vuelve a AVAILABLE
      if (currentStatus === MaintenanceStatus.IN_PROGRESS) {
        await this.vehiclesService.updateStatus(
          maintenance.vehicleId,
          VehicleStatus.AVAILABLE,
        );
      }
    }

    maintenance.status = newStatus;
    return this.maintenanceRepo.save(maintenance);
  }

  /**
   * Verifica que el mecánico no tenga mantenimientos activos que se solapen
   * con el horario solicitado. Un mecánico puede trabajar en distintos talleres
   * pero no puede tener dos mantenimientos activos en horarios que se crucen.
   */
  private async checkMechanicScheduleConflict(
    mechanicId: string,
    newStart: Date,
    newEnd: Date | null,
    excludeMaintenanceId?: string,
  ): Promise<void> {
    const activeMaintenances = await this.maintenanceRepo.find({
      where: [
        { mechanicId, status: MaintenanceStatus.SCHEDULED },
        { mechanicId, status: MaintenanceStatus.IN_PROGRESS },
      ],
    });

    for (const existing of activeMaintenances) {
      if (excludeMaintenanceId && existing.id === excludeMaintenanceId) continue;

      const existingStart = new Date(existing.scheduledDate);
      const existingEnd = existing.estimatedEndDate
        ? new Date(existing.estimatedEndDate)
        : null;

      // Regla: si no hay estimatedEndDate, se considera un instante
      // Solo hay conflicto si los horarios se solapan (no si son exactamente el mismo momento de inicio/fin)
      const newStartTime = newStart.getTime();
      const newEndTime = newEnd ? newEnd.getTime() : newStartTime;
      const existingStartTime = existingStart.getTime();
      const existingEndTime = existingEnd
        ? existingEnd.getTime()
        : existingStartTime;

      // Hay solapamiento si: inicio1 < fin2 Y inicio2 < fin1
      // (se permiten horarios contiguos: fin1 === inicio2 está bien)
      const overlaps =
        newStartTime < existingEndTime && existingStartTime < newEndTime;

      if (overlaps) {
        throw new ConflictException(
          `El mecánico ya tiene un mantenimiento activo entre ${existingStart.toISOString()} y ${existingEnd?.toISOString() ?? existingStart.toISOString()} que se solapa con el horario solicitado`,
        );
      }

      // Mismo instante exacto sin duración definida
      if (!newEnd && !existingEnd && newStartTime === existingStartTime) {
        throw new ConflictException(
          `El mecánico ya tiene un mantenimiento programado en ese mismo horario`,
        );
      }
    }
  }
}
