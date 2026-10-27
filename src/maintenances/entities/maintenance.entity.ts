import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Vehicle } from "../../vehicles/entities/vehicle.entity.js";
import { Mechanic } from "../../mechanics/entities/mechanic.entity.js";
import { Workshop } from "../../workshops/entities/workshop.entity.js";

export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("maintenances")
export class Maintenance {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "float" })
  mileage: number;

  /** Fecha programada de inicio */
  @Column({ type: "timestamp" })
  scheduledDate: Date;

  /** Fecha y hora estimada de finalización (para control de solapamiento) */
  @Column({ type: "timestamp", nullable: true })
  estimatedEndDate: Date | null;

  @Column({
    type: "enum",
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  // ─── Campos de cierre (se completan al finalizar) ───────────────────────────

  /** Trabajo realizado durante el mantenimiento */
  @Column({ type: "text", nullable: true })
  workDone: string | null;

  /** Costo final del mantenimiento */
  @Column({ type: "float", nullable: true })
  finalCost: number | null;

  /** Fecha real de finalización */
  @Column({ type: "timestamp", nullable: true })
  completedAt: Date | null;

  /** Kilometraje al finalizar el mantenimiento */
  @Column({ type: "float", nullable: true })
  finalMileage: number | null;

  // ─── Relaciones ─────────────────────────────────────────────────────────────

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenances, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Mechanic, (mechanic) => mechanic.maintenances, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: "mechanicId" })
  mechanic: Mechanic;

  @Column()
  mechanicId: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.maintenances, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: "workshopId" })
  workshop: Workshop;

  @Column()
  workshopId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
