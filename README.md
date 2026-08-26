# victrium-rh-fichaje-api

API NestJS de `Victrium RH` para la gestión corporativa de personas, centros, turnos, fichajes y configuraciones de empresa.

## Resumen

- NestJS + TypeScript
- TypeORM + MySQL externo
- API versionada en `/api/v1`
- Swagger/OpenAPI en `/api/docs`
- JWT access/refresh
- Tenant isolation centralizado
- Migraciones en lugar de `synchronize`
- Sin Docker

## Requisitos

- Node.js 20 o superior
- npm
- MySQL accesible por red o instancia local

## Entorno

1. Copia `.env.example` a `.env`.
2. Completa las credenciales de base de datos y secretos JWT.
3. Configura `CORS_ORIGINS` con los dominios reales del frontend.

Variables clave:

- `PORT`
- `DATABASE_URL` o `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`
- `TZ`
- `SWAGGER_ENABLED`

Para bootstrap de super admin y otros detalles sensibles, consulta la documentación de entorno y despliegue dentro de `docs/`.

## Desarrollo

```bash
npm install
npm run start:dev
```

Seed de desarrollo:

```bash
npm run seed:dev
```

Reinicialización del seed:

```bash
npm run seed:reset
```

## Producción

```bash
npm ci
npm run build
npm run start:prod
```

## Verificación

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Documentación principal

- [Backend production env](docs/BACKEND_PRODUCTION_ENV.md)
- [Database schema tables](docs/DATABASE_SCHEMA_TABLES.md)
- [Organizational model](docs/ORGANIZATIONAL_MODEL.md)
- [Organizational relationships QA](docs/ORGANIZATIONAL_RELATIONSHIPS_QA.md)
- [Role access matrix](docs/ROLE_ACCESS_MATRIX.md)
- [Production database bootstrap](docs/PRODUCTION_DATABASE_BOOTSTRAP.md)

## Endpoints clave

- Auth: `/api/v1/auth/*`
- Users: `/api/v1/users/*`
- Companies: `/api/v1/companies/*`
- Employees: `/api/v1/employees/*`
- Work locations: `/api/v1/work-locations/*`
- Shifts: `/api/v1/shifts/*`
- Planning periods: `/api/v1/planning-periods/*`
- Time entries: `/api/v1/time-entries/*`
- Vacations: `/api/v1/vacations/*`
- Permissions: `/api/v1/permissions/*`
- Incidents: `/api/v1/incidents/*`
- Calendars: `/api/v1/calendars/*`
- API keys: `/api/v1/api-keys/*`
- Reports: `/api/v1/reports/*`
- Health: `/api/v1/health`

## Estructura principal

- `src/modules`
- `src/common`
- `src/config`
- `src/database`
- `src/seed`
- `docs`

## Notas de entrega

- No contiene infraestructura Docker.
- `synchronize` permanece desactivado.
- La base documental refleja el modelo corporativo actual y las relaciones jerárquicas del sistema.
- No se documentan credenciales reales ni secretos operativos en este archivo.
