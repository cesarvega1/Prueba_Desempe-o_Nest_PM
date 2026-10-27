import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  IN_MAINTENANCE = "IN_MAINTENANCE",
  INACTIVE = "INACTIVE",
}

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Placa del vehiculo - debe ser unica */
  @Column({ unique: true})
  plate: string;

  @Column()
  brand:string
    
  @Column()
  model: string;

  @Column()
  year: number;

  @Column({ type: "float" })
  mileage: number;

  @Column({ type: "enum", enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  /** Relación con mantenimientos (lazy para no romper ciclos circulares) */
  @OneToMany("Maintenance", "vehicle")
  maintenances: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
