import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workshop, WorkshopStatus } from "./entities/workshop.entity.js";
import { CreateWorkshopDto, UpdateWorkshopDto } from "./dto/workshop.dto.js";

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
  ) {}

  async create(dto: CreateWorkshopDto): Promise<Workshop> {
    const workshop = this.workshopRepo.create(dto);
    return this.workshopRepo.save(workshop);
  }

  findAll(): Promise<Workshop[]> {
    return this.workshopRepo.find({ order: { createdAt: "DESC" } });
  }

  findActive(): Promise<Workshop[]> {
    return this.workshopRepo.find({
      where: { status: WorkshopStatus.ACTIVE },
      order: { name: "ASC" },
    });
  }

  async findOne(id: string): Promise<Workshop> {
    const workshop = await this.workshopRepo.findOne({ where: { id } });
    if (!workshop) {
      throw new NotFoundException(`Taller con id ${id} no encontrado`);
    }
    return workshop;
  }

  async update(id: string, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOne(id);
    Object.assign(workshop, dto);
    return this.workshopRepo.save(workshop);
  }

  async toggleStatus(id: string): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.status =
      workshop.status === WorkshopStatus.ACTIVE
        ? WorkshopStatus.INACTIVE
        : WorkshopStatus.ACTIVE;
    return this.workshopRepo.save(workshop);
  }
}
