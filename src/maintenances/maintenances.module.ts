import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MaintenancesController } from "./maintenances.controller.js";
import { MaintenancesService } from "./maintenances.service.js";
import { Maintenance } from "./entities/maintenance.entity.js";
import { VehiclesModule } from "../vehicles/vehicles.module.js";
import { MechanicsModule } from "../mechanics/mechanics.module.js";
import { WorkshopsModule } from "../workshops/workshops.module.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
