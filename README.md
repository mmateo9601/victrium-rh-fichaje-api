# victrium-rh-fichaje-api

API NestJS para la migracion de `fichaje-main` a un backend modular, versionado y documentado.

## Estado actual

- NestJS + TypeScript
- TypeORM + MySQL
- API versionada en `/api/v1`
- Swagger en `/api/docs`
- Auth con JWT access/refresh y sesiones persistidas
- Healthcheck real
- Vertical slices de auth, users, companies, employees, work locations, shifts, planning periods, time entries, vacations, permissions, incidents, calendars, api keys y reports
- Tenant isolation centralizado
- Paginacion base
- Logging y error handling global
- Sin Docker en este repositorio

## Requisitos

- Node.js 20 o superior
- npm
- MySQL accesible externamente o en red local

## Entorno

Usa [`/.env.example`](.env.example) como referencia. No contiene secretos reales.

Variables obligatorias:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Conexión MySQL:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Otras variables relevantes:

- `PORT`
- `CORS_ORIGINS`
- `TZ`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SMTP_*`

## Migraciones

Las migraciones viven en [`src/database/migrations`](src/database/migrations) y se registran en [`src/database/typeorm.options.ts`](src/database/typeorm.options.ts).

Puntos clave:

- `synchronize` permanece desactivado.
- `migrationsRun` permanece desactivado.
- El arranque usa las migraciones codificadas en el repositorio, pero no las ejecuta de forma automática en cada inicio.
- Cuando añadas una migración nueva, documenta también el impacto en los docs de base de datos y dominio.

## Desarrollo

```bash
npm install
npm run start:dev
```

Para cargar datos de desarrollo:

```bash
npm run seed:dev
```

Si necesitas reinicializar los datos seed:

```bash
npm run seed:reset
```

## Credenciales de desarrollo

Todas las cuentas seed usan la misma contraseña:

`Victrium123!`

| Email | Rol | Empresa |
| --- | --- | --- |
| `admin@victrium.local` | `ROLE_SUPER_ADMIN` | `Victrium RH Demo` |
| `admin2@victrium.local` | `ROLE_ADMIN` | `Victrium RH Demo` |
| `rrhh@victrium.local` | `ROLE_RRHH` | `Victrium RH Demo` |
| `laura@victrium.local` | `ROLE_USER` | `Victrium RH Demo` |
| `carlos@victrium.local` | `ROLE_USER` | `Victrium RH Demo` |
| `admin@acme.local` | `ROLE_ADMIN` | `Acme Industrial` |

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
- `src/modules/work-locations`
- `src/modules/shifts`
- `src/modules/planning-periods`
- `src/modules/time-entries`
- `src/modules/vacations`
- `src/modules/permissions`
- `src/modules/incidents`
- `src/modules/calendars`
- `src/modules/api-keys`
- `src/modules/reports`
- `src/modules/health`
- `src/common`
- `src/config`
- `src/database`
- `docs/adr`

## Endpoints principales

Auth:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/password`

Core organization:

- `GET /api/v1/users`
- `GET /api/v1/users/me`
- `GET /api/v1/users/:id`
- `GET /api/v1/companies`
- `GET /api/v1/companies/me`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:id`
- `PATCH /api/v1/companies/:id`
- `GET /api/v1/work-locations`
- `GET /api/v1/work-locations/:id`
- `GET /api/v1/work-locations/:id/employees`
- `GET /api/v1/employee-location-assignments`
- `POST /api/v1/employee-location-assignments`
- `PATCH /api/v1/employee-location-assignments/:id`
- `GET /api/v1/calendars`
- `GET /api/v1/calendars/list/dto`
- `GET /api/v1/calendars/:id`
- `POST /api/v1/calendars`
- `PATCH /api/v1/calendars/:id`
- `DELETE /api/v1/calendars/:id`

Workforce planning:

- `GET /api/v1/employees`
- `GET /api/v1/employees/me`
- `GET /api/v1/employees/:id`
- `POST /api/v1/employees`
- `PATCH /api/v1/employees/:id`
- `PATCH /api/v1/employees/:id/activate`
- `PATCH /api/v1/employees/:id/deactivate`
- `GET /api/v1/shifts`
- `GET /api/v1/shifts/me`
- `GET /api/v1/shifts/:id`
- `POST /api/v1/shifts`
- `PATCH /api/v1/shifts/:id`
- `POST /api/v1/shifts/:id/activate`
- `POST /api/v1/shifts/:id/deactivate`
- `GET /api/v1/shifts/:id/assignments`
- `GET /api/v1/shift-assignments`
- `POST /api/v1/shift-assignments`
- `PATCH /api/v1/shift-assignments/:id`
- `GET /api/v1/shift-assignments/overrides`
- `POST /api/v1/shift-assignments/overrides`
- `PATCH /api/v1/shift-assignments/overrides/:id`
- `GET /api/v1/schedule`
- `GET /api/v1/schedule/me`
- `GET /api/v1/employees/:id/schedule`
- `GET /api/v1/planning-periods`
- `GET /api/v1/planning-periods/:id`
- `POST /api/v1/planning-periods`
- `PATCH /api/v1/planning-periods/:id`
- `POST /api/v1/planning-periods/:id/publish`
- `POST /api/v1/planning-periods/:id/unpublish`
- `GET /api/v1/planning-periods/:id/audits`

Attendance and absences:

- `POST /api/v1/time-entries/clock`
- `GET /api/v1/time-entries/me/current`
- `GET /api/v1/time-entries/me/eligibility`
- `POST /api/v1/time-entries/start`
- `POST /api/v1/time-entries/me/pause`
- `POST /api/v1/time-entries/me/resume`
- `POST /api/v1/time-entries/me/finish`
- `GET /api/v1/time-entries`
- `GET /api/v1/time-entries/me`
- `GET /api/v1/time-entries/:id`
- `POST /api/v1/time-entries/:id/pause`
- `POST /api/v1/time-entries/:id/resume`
- `POST /api/v1/time-entries/:id/finish`
- `GET /api/v1/time-entries/:id/audits`
- `POST /api/v1/time-entries/:id/correction`
- `GET /api/v1/vacations`
- `GET /api/v1/vacations/me`
- `GET /api/v1/vacations/:id`
- `POST /api/v1/vacations`
- `PATCH /api/v1/vacations/:id/approve`
- `PATCH /api/v1/vacations/:id/deny`
- `GET /api/v1/permissions`
- `GET /api/v1/permissions/me`
- `GET /api/v1/permissions/:id`
- `POST /api/v1/permissions`
- `PATCH /api/v1/permissions/:id/approve`
- `PATCH /api/v1/permissions/:id/deny`
- `DELETE /api/v1/permissions/:id`
- `GET /api/v1/permissions/stats/months`
- `GET /api/v1/permissions/stats/users`

Operations:

- `GET /api/v1/incidents`
- `GET /api/v1/incidents/me`
- `GET /api/v1/incidents/:id`
- `POST /api/v1/incidents`
- `PATCH /api/v1/incidents/:id`
- `PATCH /api/v1/incidents/:id/resolve`
- `GET /api/v1/incidents/stats/months`
- `GET /api/v1/incidents/stats/users`
- `GET /api/v1/incidents/stats/top`
- `GET /api/v1/api-keys`
- `GET /api/v1/api-keys/users/:userId`
- `GET /api/v1/api-keys/:id`
- `POST /api/v1/api-keys`
- `PATCH /api/v1/api-keys/:id/activate`
- `PATCH /api/v1/api-keys/:id/deactivate`
- `DELETE /api/v1/api-keys/:id`
- `GET /api/v1/reports/summary`
- `GET /api/v1/health`

## Swagger

- UI: `/api/docs`
- JSON: `/api/docs-json`
- Soporta `Bearer` JWT y `x-api-key`

## Documentacion

- [Migration matrix](docs/MIGRATION_MATRIX.md)
- [Nest/Next migration notes](docs/MIGRATION_NEST_NEXT.md)
- [Organizational model](docs/ORGANIZATIONAL_MODEL.md)
- [Role access matrix](docs/ROLE_ACCESS_MATRIX.md)
- [Scheduling domain](docs/SCHEDULING_DOMAIN.md)
- [Shifts domain](docs/SHIFTS_DOMAIN.md)
- [Settings domain](docs/SETTINGS_DOMAIN.md)
- [UML implementation matrix](docs/UML_IMPLEMENTATION_MATRIX.md)
- [UML test traceability](docs/UML_TEST_TRACEABILITY.md)
- [QA test plan](docs/QA_TEST_PLAN.md)
- [Tenant isolation ADR](docs/adr/004-tenant-isolation.md)
