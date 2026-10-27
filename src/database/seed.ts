import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

import { User, UserRole } from "../users/entities/user.entity.js";
import { Mechanic, MechanicStatus } from "../mechanics/entities/mechanic.entity.js";
import { Workshop, WorkshopStatus } from "../workshops/entities/workshop.entity.js";
import { Vehicle, VehicleStatus } from "../vehicles/entities/vehicle.entity.js";
import {
  Maintenance,
  MaintenanceStatus,
  MaintenanceType,
} from "../maintenances/entities/maintenance.entity.js";

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "fleetcore_db",
  entities: [User, Mechanic, Workshop, Vehicle, Maintenance],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log(" Conexión a base de datos establecida");

  const userRepo = AppDataSource.getRepository(User);
  const mechanicRepo = AppDataSource.getRepository(Mechanic);
  const workshopRepo = AppDataSource.getRepository(Workshop);
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const maintenanceRepo = AppDataSource.getRepository(Maintenance);

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@fleetcore.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345!";

  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = userRepo.create({
      name: "Administrador FleetCore",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.ADMIN,
    });
    admin = await userRepo.save(admin);
    console.log(` Usuario ADMIN creado: ${adminEmail}`);
  } else {
    console.log(`  Usuario ADMIN ya existe: ${adminEmail}`);
  }

  let technician1 = await userRepo.findOne({
    where: { email: "tecnico1@fleetcore.com" },
  });
  if (!technician1) {
    technician1 = userRepo.create({
      name: "Luis Martínez",
      email: "tecnico1@fleetcore.com",
      password: await bcrypt.hash("Tecnico123!", 10),
      role: UserRole.TECHNICIAN,
    });
    technician1 = await userRepo.save(technician1);
    console.log(" Usuario TECHNICIAN 1 creado");
  } else {
    console.log("  TECHNICIAN 1 ya existe");
  }

  let technician2 = await userRepo.findOne({
    where: { email: "tecnico2@fleetcore.com" },
  });
  if (!technician2) {
    technician2 = userRepo.create({
      name: "Ana González",
      email: "tecnico2@fleetcore.com",
      password: await bcrypt.hash("Tecnico123!", 10),
      role: UserRole.TECHNICIAN,
    });
    technician2 = await userRepo.save(technician2);
    console.log(" Usuario TECHNICIAN 2 creado");
  } else {
    console.log("  TECHNICIAN 2 ya existe");
  }

  // ─── Worckshop ─────────────────────────────────────────────────────────────
  let workshop1 = await workshopRepo.findOne({
    where: { name: "Taller Central FleetCore" },
  });
  if (!workshop1) {
    workshop1 = workshopRepo.create({
      name: "Taller Central FleetCore",
      address: "Calle 72 #15-30, Bogotá",
      status: WorkshopStatus.ACTIVE,
    });
    workshop1 = await workshopRepo.save(workshop1);
    console.log(" Taller 1 (activo) creado");
  } else {
    console.log(" Taller 1 ya existe");
  }

  let workshop2 = await workshopRepo.findOne({
    where: { name: "Taller Norte (Inactivo)" },
  });
  if (!workshop2) {
    workshop2 = workshopRepo.create({
      name: "Taller Norte (Inactivo)",
      address: "Av. Carrera 9 #120-45, Bogotá",
      status: WorkshopStatus.INACTIVE,
    });
    workshop2 = await workshopRepo.save(workshop2);
    console.log(" Taller 2 (inactivo) creado");
  } else {
    console.log("Taller 2 ya existe");
  }

  // ─── Mechanics ────────────────────────────────────────────────────────────
  let mechanic1 = await mechanicRepo.findOne({
    where: { email: "tecnico1@fleetcore.com" },
  });
  if (!mechanic1) {
    mechanic1 = mechanicRepo.create({
      name: "Luis Martínez",
      email: "tecnico1@fleetcore.com",
      specialty: "Motor y transmisión",
      status: MechanicStatus.ACTIVE,
    });
    mechanic1 = await mechanicRepo.save(mechanic1);
    console.log(" Mecánico 1 (activo) creado");
  } else {
    console.log("  Mecánico 1 ya existe");
  }

  let mechanic2 = await mechanicRepo.findOne({
    where: { email: "tecnico2@fleetcore.com" },
  });
  if (!mechanic2) {
    mechanic2 = mechanicRepo.create({
      name: "Ana González",
      email: "tecnico2@fleetcore.com",
      specialty: "Suspensión y frenos",
      status: MechanicStatus.ACTIVE,
    });
    mechanic2 = await mechanicRepo.save(mechanic2);
    console.log(" Mecánico 2 (activo) creado");
  } else {
    console.log(" Mecánico 2 ya existe");
  }

  let mechanic3 = await mechanicRepo.findOne({
    where: { email: "mecanico-inactivo@fleetcore.com" },
  });
  if (!mechanic3) {
    mechanic3 = mechanicRepo.create({
      name: "Roberto Gómez",
      email: "mecanico-inactivo@fleetcore.com",
      specialty: "Electricidad automotriz",
      status: MechanicStatus.INACTIVE,
    });
    mechanic3 = await mechanicRepo.save(mechanic3);
    console.log(" Mecánico 3 (inactivo) creado");
  } else {
    console.log("  Mecánico 3 ya existe");
  }

  // ─── Vehicles ────────────────────────────────────────────────────────────
  let vehicle1 = await vehicleRepo.findOne({ where: { plate: "ABC-001" } });
  if (!vehicle1) {
    vehicle1 = vehicleRepo.create({
      plate: "ABC-001",
      brand: "Toyota",
      model: "Hilux",
      year: 2022,
      mileage: 45000,
      status: VehicleStatus.AVAILABLE,
    });
    vehicle1 = await vehicleRepo.save(vehicle1);
    console.log(" Vehículo 1 (AVAILABLE) creado");
  } else {
    console.log(" Vehículo 1 ya existe");
  }

  let vehicle2 = await vehicleRepo.findOne({ where: { plate: "DEF-002" } });
  if (!vehicle2) {
    vehicle2 = vehicleRepo.create({
      plate: "DEF-002",
      brand: "Ford",
      model: "Ranger",
      year: 2021,
      mileage: 62000,
      status: VehicleStatus.AVAILABLE,
    });
    vehicle2 = await vehicleRepo.save(vehicle2);
    console.log(" Vehículo 2 (AVAILABLE) creado");
  } else {
    console.log("  Vehículo 2 ya existe");
  }

  let vehicle3 = await vehicleRepo.findOne({ where: { plate: "GHI-003" } });
  if (!vehicle3) {
    vehicle3 = vehicleRepo.create({
      plate: "GHI-003",
      brand: "Chevrolet",
      model: "D-Max",
      year: 2020,
      mileage: 89000,
      status: VehicleStatus.IN_MAINTENANCE,
    });
    vehicle3 = await vehicleRepo.save(vehicle3);
    console.log(" Vehículo 3 (IN_MAINTENANCE) creado");
  } else {
    console.log("  Vehículo 3 ya existe");
  }

  let vehicle4 = await vehicleRepo.findOne({ where: { plate: "JKL-004" } });
  if (!vehicle4) {
    vehicle4 = vehicleRepo.create({
      plate: "JKL-004",
      brand: "Nissan",
      model: "Frontier",
      year: 2018,
      mileage: 145000,
      status: VehicleStatus.INACTIVE,
    });
    vehicle4 = await vehicleRepo.save(vehicle4);
    console.log(" Vehículo 4 (INACTIVE) creado");
  } else {
    console.log("  Vehículo 4 ya existe");
  }

  // ─── Maintenances ───────────────────────────────────────────────────────

  // Maintenances IN_PROGRESS para vehículo 3
  const existingInProgress = await maintenanceRepo.findOne({
    where: { vehicleId: vehicle3.id, status: MaintenanceStatus.IN_PROGRESS },
  });
  if (!existingInProgress) {
    const inProgressMaintenance = maintenanceRepo.create({
      type: MaintenanceType.CORRECTIVE,
      description: "Reparación de sistema de frenos delanteros",
      mileage: 89000,
      scheduledDate: new Date("2024-08-10T07:30:00.000Z"),
      estimatedEndDate: new Date("2024-08-10T11:00:00.000Z"),
      status: MaintenanceStatus.IN_PROGRESS,
      vehicleId: vehicle3.id,
      mechanicId: mechanic1.id,
      workshopId: workshop1.id,
    });
    await maintenanceRepo.save(inProgressMaintenance);
    console.log(" Mantenimiento IN_PROGRESS para vehículo 3 creado");
  } else {
    console.log("  Mantenimiento IN_PROGRESS ya existe");
  }

  // Maintenances COMPLETED para historial del vehículo 1
  const existingCompleted = await maintenanceRepo.findOne({
    where: { vehicleId: vehicle1.id, status: MaintenanceStatus.COMPLETED },
  });
  if (!existingCompleted) {
    const completedMaintenance = maintenanceRepo.create({
      type: MaintenanceType.PREVENTIVE,
      description: "Cambio de aceite 5W30, filtro de aceite y aire",
      mileage: 40000,
      scheduledDate: new Date("2024-06-01T08:00:00.000Z"),
      estimatedEndDate: new Date("2024-06-01T10:00:00.000Z"),
      status: MaintenanceStatus.COMPLETED,
      workDone: "Se realizó cambio de aceite sintético 5W30, filtro de aceite y filtro de aire. Se revisó nivel de líquidos.",
      finalCost: 350000,
      completedAt: new Date("2024-06-01T09:45:00.000Z"),
      finalMileage: 40050,
      vehicleId: vehicle1.id,
      mechanicId: mechanic2.id,
      workshopId: workshop1.id,
    });
    await maintenanceRepo.save(completedMaintenance);
    console.log(" Mantenimiento COMPLETED (historial) creado para vehículo 1");
  } else {
    console.log(" Mantenimiento COMPLETED ya existe");
  }

  // Mantenimiento SCHEDULED para vehículo 2
  const existingScheduled = await maintenanceRepo.findOne({
    where: { vehicleId: vehicle2.id, status: MaintenanceStatus.SCHEDULED },
  });
  if (!existingScheduled) {
    const scheduledMaintenance = maintenanceRepo.create({
      type: MaintenanceType.PREVENTIVE,
      description: "Mantenimiento preventivo 60.000 km - revisión general",
      mileage: 62000,
      scheduledDate: new Date("2024-09-05T09:00:00.000Z"),
      estimatedEndDate: new Date("2024-09-05T13:00:00.000Z"),
      status: MaintenanceStatus.SCHEDULED,
      vehicleId: vehicle2.id,
      mechanicId: mechanic2.id,
      workshopId: workshop1.id,
    });
    await maintenanceRepo.save(scheduledMaintenance);
    console.log("Mantenimiento SCHEDULED para vehículo 2 creado");
  } else {
    console.log(" Mantenimiento SCHEDULED ya existe");
  }

  await AppDataSource.destroy();
  console.log("\nSeeder ejecutado exitosamente!");
  console.log("─".repeat(50));
  console.log("Credenciales de acceso:");
  console.log(`  ADMIN:       ${adminEmail} / ${adminPassword}`);
  console.log("  TECHNICIAN1: tecnico1@fleetcore.com / Tecnico123!");
  console.log("  TECHNICIAN2: tecnico2@fleetcore.com / Tecnico123!");
}

seed().catch((err) => {
  console.error(" Error en el seeder:", err);
  process.exit(1);
});
