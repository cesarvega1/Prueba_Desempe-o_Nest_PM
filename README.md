#  FleetCore API

API REST desarrollada con **NestJS + TypeScript + TypeORM + PostgreSQL + JWT** para la gestión del mantenimiento de la flota de vehículos FleetCore.

##  Documentación Swagger

> **URL:** `http://localhost:3000/api/docs`

La documentación interactiva Swagger UI está disponible en la URL anterior una vez la aplicación esté corriendo.

---

##  Inicio rápido

### 1. Prerrequisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Poblar la base de datos

```bash
npm run seed
```

> Ejecutar el seeder dos veces **no duplica registros** — es idempotente.

### 5. Correr la aplicación

```bash
npm run start:dev
```

---

##  Credenciales iniciales (Seed)

| Rol          | Email                          | Contraseña    |
|--------------|--------------------------------|---------------|
| ADMIN        | admin@fleetcore.com            | Admin12345!   |
| TECHNICIAN 1 | tecnico1@fleetcore.com         | Tecnico123!   |
| TECHNICIAN 2 | tecnico2@fleetcore.com         | Tecnico123!   |

---

##  Endpoints principales

### Auth
| Método | Ruta               | Descripción                          | Auth  |
|--------|--------------------|--------------------------------------|-------|
| POST   | /api/auth/register | Registrar usuario nuevo              | x    |
| POST   | /api/auth/login    | Iniciar sesión (retorna JWT)         | x    |
| GET    | /api/auth/profile  | Perfil del usuario autenticado       | JWT   |

### Vehicles
| Método | Ruta                        | Descripción                | Rol       |
|--------|-----------------------------|----------------------------|-----------|
| POST   | /api/vehicles               | Registrar vehículo         | ADMIN     |
| GET    | /api/vehicles               | Listar vehículos           | Cualquiera|
| GET    | /api/vehicles/:id           | Detalle por ID             | Cualquiera|
| GET    | /api/vehicles/plate/:plate  | Buscar por placa           | Cualquiera|
| PATCH  | /api/vehicles/:id           | Actualizar vehículo        | ADMIN     |
| DELETE | /api/vehicles/:id           | Inactivar vehículo         | ADMIN     |

### Mechanics
| Método | Ruta                            | Descripción                | Rol       |
|--------|---------------------------------|----------------------------|-----------|
| POST   | /api/mechanics                  | Registrar mecánico         | ADMIN     |
| GET    | /api/mechanics                  | Listar mecánicos           | Cualquiera|
| GET    | /api/mechanics/:id              | Detalle de mecánico        | Cualquiera|
| PATCH  | /api/mechanics/:id              | Actualizar mecánico        | ADMIN     |
| PATCH  | /api/mechanics/:id/toggle-status| Activar/Inactivar          | ADMIN     |

### Workshops
| Método | Ruta                             | Descripción                | Rol       |
|--------|----------------------------------|----------------------------|-----------|
| POST   | /api/workshops                   | Registrar taller           | ADMIN     |
| GET    | /api/workshops                   | Listar talleres            | Cualquiera|
| GET    | /api/workshops/active            | Listar talleres activos    | Cualquiera|
| GET    | /api/workshops/:id               | Detalle de taller          | Cualquiera|
| PATCH  | /api/workshops/:id               | Actualizar taller          | ADMIN     |
| PATCH  | /api/workshops/:id/toggle-status | Activar/Inactivar          | ADMIN     |

### Maintenances
| Método | Ruta                                       | Descripción                         | Auth           |
|--------|--------------------------------------------|-------------------------------------|----------------|
| POST   | /api/maintenances                          | Crear mantenimiento                 | ADMIN/MANAGER  |
| GET    | /api/maintenances                          | Listar todos                        | JWT            |
| GET    | /api/maintenances/active                   | Listar activos                      | JWT            |
| GET    | /api/maintenances/external/active          | Activos para integración externa    | x-api-key      |
| GET    | /api/maintenances/vehicle/:vehicleId       | Por vehículo                        | JWT            |
| GET    | /api/maintenances/history/vehicle/:id      | Historial por vehículo              | JWT            |
| GET    | /api/maintenances/mechanic/:mechanicId     | Por mecánico                        | JWT            |
| GET    | /api/maintenances/:id                      | Detalle                             | JWT            |
| PATCH  | /api/maintenances/:id/status               | Actualizar estado                   | JWT            |

---

##  Estados del mantenimiento

```
SCHEDULED → IN_PROGRESS → COMPLETED
SCHEDULED → CANCELLED
IN_PROGRESS → CANCELLED
```

> **COMPLETED** y **CANCELLED** son estados finales irreversibles.

##  Estados del vehículo (automáticos)

| Evento                          | Estado resultante    |
|---------------------------------|----------------------|
| Mantenimiento → IN_PROGRESS     | IN_MAINTENANCE       |
| Mantenimiento → COMPLETED       | AVAILABLE            |
| Mantenimiento → CANCELLED       | AVAILABLE            |

---

##  Arquitectura del proyecto

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
│   └── env.schema.ts        Validación Zod de variables de entorno
├── database/
│   └── seed.ts              Seeder idempotente
├── maintenances/
├── mechanics/
├── vehicles/
├── workshops/
├── users/
├── app.module.ts
└── main.ts
```

##  Variables de entorno

Ver `.env.example` para la lista completa. Variables principales:

| Variable    | Descripción                          |
|-------------|--------------------------------------|
| DB_HOST     | Host de PostgreSQL                   |
| DB_PORT     | Puerto de PostgreSQL (default: 5432) |
| JWT_SECRET  | Secreto para firmar JWT (min 32 chars)|
| API_KEY     | Clave para integraciones externas    |
| ADMIN_EMAIL | Email del admin inicial (seed)       |
