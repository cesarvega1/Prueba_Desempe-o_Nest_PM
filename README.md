#  FleetCore API

REST API built with **NestJS + TypeScript + TypeORM + PostgreSQL + JWT** for managing the vehicle fleet maintenance of FleetCore.

##  Swagger Documentation

> **URL:** `http://localhost:3000/api/docs`


Interactive Swagger UI documentation is available at the URL above once the application is running.

> **URL GIT:** `https://github.com/cesarvega1/Prueba_Desempe-o_NodePM`

## Information
- Nombre: Cesar Vega Morales
- Clan: Centurion Node-Pm

---

##  Quick Start

### 1. Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials.

### 3. Install dependencies

```bash
npm install
```

### 4. Seed the database

```bash
npm run seed
```

> Running the seeder twice **does not duplicate records** — it is idempotent.

### 5. Run the application

```bash
npm run start:dev
```

---

##  Initial Credentials (Seed)

| Role         | Email                          | Password      |
|--------------|--------------------------------|---------------|
| ADMIN        | admin@fleetcore.com            | Admin12345!   |
| TECHNICIAN 1 | tecnico1@fleetcore.com         | Tecnico123!   |
| TECHNICIAN 2 | tecnico2@fleetcore.com         | Tecnico123!   |

---

##  Main Endpoints

### Auth
| Method | Route              | Description                        | Auth  |
|--------|--------------------|------------------------------------|-------|
| POST   | /api/auth/register | Register a new user                | —     |
| POST   | /api/auth/login    | Login (returns JWT)                | —     |
| GET    | /api/auth/profile  | Get authenticated user profile     | JWT   |

### Vehicles
| Method | Route                       | Description               | Role       |
|--------|-----------------------------|---------------------------|------------|
| POST   | /api/vehicles               | Register a vehicle        | ADMIN      |
| GET    | /api/vehicles               | List all vehicles         | Any        |
| GET    | /api/vehicles/:id           | Get vehicle by ID         | Any        |
| GET    | /api/vehicles/plate/:plate  | Search by plate           | Any        |
| PATCH  | /api/vehicles/:id           | Update vehicle            | ADMIN      |
| DELETE | /api/vehicles/:id           | Deactivate vehicle        | ADMIN      |

### Mechanics
| Method | Route                           | Description               | Role       |
|--------|---------------------------------|---------------------------|------------|
| POST   | /api/mechanics                  | Register a mechanic       | ADMIN      |
| GET    | /api/mechanics                  | List all mechanics        | Any        |
| GET    | /api/mechanics/:id              | Get mechanic by ID        | Any        |
| PATCH  | /api/mechanics/:id              | Update mechanic           | ADMIN      |
| PATCH  | /api/mechanics/:id/toggle-status| Activate / Deactivate     | ADMIN      |

### Workshops
| Method | Route                            | Description               | Role       |
|--------|----------------------------------|---------------------------|------------|
| POST   | /api/workshops                   | Register a workshop       | ADMIN      |
| GET    | /api/workshops                   | List all workshops        | Any        |
| GET    | /api/workshops/active            | List active workshops     | Any        |
| GET    | /api/workshops/:id               | Get workshop by ID        | Any        |
| PATCH  | /api/workshops/:id               | Update workshop           | ADMIN      |
| PATCH  | /api/workshops/:id/toggle-status | Activate / Deactivate     | ADMIN      |

### Maintenances
| Method | Route                                   | Description                          | Auth           |
|--------|-----------------------------------------|--------------------------------------|----------------|
| POST   | /api/maintenances                       | Create maintenance record            | ADMIN          |
| GET    | /api/maintenances                       | List all maintenances                | JWT            |
| GET    | /api/maintenances/active                | List active maintenances             | JWT            |
| GET    | /api/maintenances/external/active       | Active maintenances (external)       | x-api-key      |
| GET    | /api/maintenances/vehicle/:vehicleId    | Maintenances by vehicle              | JWT            |
| GET    | /api/maintenances/history/vehicle/:id   | Maintenance history by vehicle       | JWT            |
| GET    | /api/maintenances/mechanic/:mechanicId  | Maintenances by mechanic             | JWT            |
| GET    | /api/maintenances/:id                   | Get maintenance detail               | JWT            |
| PATCH  | /api/maintenances/:id/status            | Update maintenance status            | JWT            |

---

##  Maintenance Status Flow

```
SCHEDULED → IN_PROGRESS → COMPLETED
SCHEDULED → CANCELLED
IN_PROGRESS → CANCELLED
```

> **COMPLETED** and **CANCELLED** are final irreversible states.

##  Vehicle Status (automatic transitions)

| Event                           | Resulting status     |
|---------------------------------|----------------------|
| Maintenance → IN_PROGRESS       | IN_MAINTENANCE       |
| Maintenance → COMPLETED         | AVAILABLE            |
| Maintenance → CANCELLED         | AVAILABLE            |

---

##  Project Architecture

```
src/
├── auth/
│   ├── decorators/          @Roles(), @CurrentUser(), @Public()
│   ├── guards/              JwtAuthGuard, RolesGuard, ApiKeyGuard
│   ├── dto/                 auth.dto.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.module.ts
├── common/
│   ├── filters/             AllExceptionsFilter
│   └── interceptors/        ResponseInterceptor
├── config/
│   └── env.schema.ts        Zod environment variable validation
├── database/
│   └── seed.ts              Idempotent database seeder
├── maintenances/
├── mechanics/
├── vehicles/
├── workshops/
├── users/
├── app.module.ts
└── main.ts
```

##  Response Format

All endpoints return a normalized JSON envelope:

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "path": "/api/endpoint",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

##  Environment Variables

See `.env.example` for the full list. Main variables:

| Variable       | Description                            |
|----------------|----------------------------------------|
| DB_HOST        | PostgreSQL host                        |
| DB_PORT        | PostgreSQL port (default: 5432)        |
| DB_USER        | PostgreSQL username                    |
| DB_PASSWORD    | PostgreSQL password                    |
| DB_NAME        | Database name                          |
| DB_SYNC        | Auto-sync TypeORM schema (true/false)  |
| JWT_SECRET     | Secret for signing JWTs (min 32 chars) |
| JWT_EXPIRES_IN | JWT expiration in seconds              |
| API_KEY        | Key for external integrations          |
| ADMIN_EMAIL    | Initial admin email (seed)             |
| ADMIN_PASSWORD | Initial admin password (seed)          |

---

##  Running Tests

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```
