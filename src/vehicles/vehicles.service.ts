import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vehicle, VehicleStatus } from "./entities/vehicle.entity.js";
import { CreateVehicleDto, UpdateVehicleDto } from "./dto/vehicle.dto.js";

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const exists = await this.vehicleRepo.findOne({
      where: { plate: dto.plate },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${dto.plate}`,
      );
    }

    const vehicle = this.vehicleRepo.create(dto);
    return this.vehicleRepo.save(vehicle);
  }

  findAll(): Promise<Vehicle[]> {
    return this.vehicleRepo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    return vehicle;
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { plate } });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con placa ${plate} no encontrado`);
    }
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    // Cannot change plate to one that already exists
    if (dto.plate && dto.plate !== vehicle.plate) {
      const plateExists = await this.vehicleRepo.findOne({
        where: { plate: dto.plate },
      });
      if (plateExists) {
        throw new ConflictException(`la placa ${dto.plate} ya esta registrada`)
      }
    }

    Object.assign(vehicle, dto);
    return this.vehicleRepo.save(vehicle);
  }

  /** Logical deactivation — preserves maintenance history */
  async deactivate(id: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehicleRepo.save(vehicle);
  }

  /** Internal method used by the maintenances module to update vehicle status */
  async updateStatus(id: string, status: VehicleStatus): Promise<void> {
    await this.vehicleRepo.update(id, { status });
  }
}
