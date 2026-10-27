import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Mechanic, MechanicStatus } from "./entities/mechanic.entity.js";
import { CreateMechanicDto, UpdateMechanicDto } from "./dto/mechanic.dto.js";

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanicRepo: Repository<Mechanic>,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const exists = await this.mechanicRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un mecánico con el correo ${dto.email}`,
      );
    }

    const mechanic = this.mechanicRepo.create(dto);
    return this.mechanicRepo.save(mechanic);
  }

  findAll(): Promise<Mechanic[]> {
    return this.mechanicRepo.find({ order: { name: "ASC" } });
  }

  async findOne(id: string): Promise<Mechanic> {
    const mechanic = await this.mechanicRepo.findOne({ where: { id } });
    if (!mechanic) {
      throw new NotFoundException(`Mecánico con id ${id} no encontrado`);
    }
    return mechanic;
  }

  async update(id: string, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findOne(id);

    if (dto.email && dto.email !== mechanic.email) {
      const emailExists = await this.mechanicRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException(`El correo ${dto.email} ya está en uso`);
      }
    }

    Object.assign(mechanic, dto);
    return this.mechanicRepo.save(mechanic);
  }

  /** Activa o inactiva un mecánico sin eliminar su historial */
  async toggleStatus(id: string): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.status =
      mechanic.status === MechanicStatus.ACTIVE
        ? MechanicStatus.INACTIVE
        : MechanicStatus.ACTIVE;
    return this.mechanicRepo.save(mechanic);
  }
}
