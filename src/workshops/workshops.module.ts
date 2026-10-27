import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WorkshopsController } from "./workshops.controller.js";
import { WorkshopsService } from "./workshops.service.js";
import { Workshop } from "./entities/workshop.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([Workshop])],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
