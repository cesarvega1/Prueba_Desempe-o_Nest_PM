import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import { envSchema, Env } from "./config/env.schema.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor.js";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "./auth/guards/roles.guard.js";

import { AuthModule } from "./auth/auth.module.js";
import { VehiclesModule } from "./vehicles/vehicles.module.js";
import { MechanicsModule } from "./mechanics/mechanics.module.js";
import { WorkshopsModule } from "./workshops/workshops.module.js";
import { MaintenancesModule } from "./maintenances/maintenances.module.js";

// Entities for TypeORM
import { User } from "./users/entities/user.entity.js";
import { Vehicle } from "./vehicles/entities/vehicle.entity.js";
import { Mechanic } from "./mechanics/entities/mechanic.entity.js";
import { Workshop } from "./workshops/entities/workshop.entity.js";
import { Maintenance } from "./maintenances/entities/maintenance.entity.js";

@Module({
  imports: [
    // Environment variables with Zod validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
      validate: (config) => envSchema.parse(config),
    }),

    // TypeORM with PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        type: "postgres",
        host: configService.get("DB_HOST"),
        port: configService.get("DB_PORT"),
        username: configService.get("DB_USER"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_NAME"),
        entities: [User, Vehicle, Mechanic, Workshop, Maintenance],
        synchronize: configService.get("DB_SYNC"),
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),

    AuthModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Global JWT guard (routes decorated with @Public() are exempt)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

