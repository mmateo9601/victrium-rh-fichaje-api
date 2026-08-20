# victrium-rh-fichaje-api

API NestJS para la migracion de `fichaje-main` a un backend modular y versionado.

## Estado actual

- NestJS + TypeScript
- TypeORM + MySQL
- `/api/v1`
- Swagger en `/api/docs`
- Auth con JWT access/refresh y sesiones persistidas
- Healthcheck real
- Vertical slice de fichajes
- Vertical slice de companies/users/employees
- Vertical slice de vacations
- Tenant isolation centralizado
- Paginacion base
- Logging y error handling global
- Sin Docker

## Requisitos

- Node.js 20 o superior
- npm
- MySQL accesible externamente o en red local

## Variables de entorno

Usa `.env.example` como referencia.

Obligatorias:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Conexion MySQL:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Otras:

- `PORT`
- `CORS_ORIGINS`
- `TZ`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SMTP_*`

## Desarrollo

```bash
npm install
npm run start:dev
```

## Produccion

```bash
npm ci
npm run build
npm run start:prod
```

## Verificacion

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Estructura

- `src/modules/auth`
- `src/modules/users`
- `src/modules/companies`
- `src/modules/employees`
- `src/modules/time-entries`
- `src/modules/health`
- `src/common`
- `src/config`
- `src/database`
- `docs/adr`

## Endpoints principales

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `GET /api/v1/users/me`
- `GET /api/v1/users/:id`
- `GET /api/v1/companies`
- `GET /api/v1/companies/me`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:id`
- `PATCH /api/v1/companies/:id`
- `GET /api/v1/employees`
- `GET /api/v1/employees/me`
- `GET /api/v1/employees/:id`
- `POST /api/v1/employees`
- `PATCH /api/v1/employees/:id`
- `PATCH /api/v1/employees/:id/activate`
- `PATCH /api/v1/employees/:id/deactivate`
- `POST /api/v1/time-entries/clock`
- `GET /api/v1/time-entries`
- `GET /api/v1/time-entries/me`
- `GET /api/v1/time-entries/:id`
- `GET /api/v1/vacations`
- `GET /api/v1/vacations/me`
- `GET /api/v1/vacations/:id`
- `POST /api/v1/vacations`
- `PATCH /api/v1/vacations/:id/approve`
- `PATCH /api/v1/vacations/:id/deny`
- `GET /api/v1/health`

## Documentacion

- [Migration matrix](docs/MIGRATION_MATRIX.md)
- [Nest/Next migration notes](docs/MIGRATION_NEST_NEXT.md)
- [Organizational model](docs/ORGANIZATIONAL_MODEL.md)
- [Tenant isolation ADR](docs/adr/004-tenant-isolation.md)
