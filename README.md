# victrium-rh-fichaje-api

NestJS API for `Victrium RH`.

## Overview

API corporativa para gestión de usuarios, empresas, centros, empleados, turnos, planificación, fichajes y reglas de negocio multiempresa.

## Stack

- NestJS 10
- TypeScript
- TypeORM 0.3
- MySQL externo o local
- JWT access/refresh
- Swagger/OpenAPI
- Migrations-first database flow

## Requirements

- Node.js 20 o superior
- npm
- MySQL accesible por red o instancia local

## Environment

Copy `.env.example` to `.env` and fill in:

- `PORT`
- `DATABASE_URL` or the `DB_*` variables
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`
- `TZ`
- `BOOTSTRAP_SUPER_ADMIN`

Notes:

- Keep production secrets out of the repository.
- `CORS_ORIGINS` must match the deployed frontend domains.
- The bootstrap account is only for controlled deployment/setup flows.

## Quick Start

```bash
npm install
npm run start:dev
```

## Development Seed

```bash
npm run seed:dev
```

Reset seed:

```bash
npm run seed:reset
```

## Production

```bash
npm ci
npm run build
npm run start:prod
```

## Quality Gates

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Database Bootstrap

Use the documented production flow to create a database from zero:

```bash
npm run migration:run
npm run bootstrap:super-admin
```

See:

- [Production database bootstrap](docs/PRODUCTION_DATABASE_BOOTSTRAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Main API Areas

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

## Documentation

- [Backend production env](docs/BACKEND_PRODUCTION_ENV.md)
- [Database schema tables](docs/DATABASE_SCHEMA_TABLES.md)
- [Organizational model](docs/ORGANIZATIONAL_MODEL.md)
- [Organizational relationships QA](docs/ORGANIZATIONAL_RELATIONSHIPS_QA.md)
- [Role access matrix](docs/ROLE_ACCESS_MATRIX.md)
- [Production database bootstrap](docs/PRODUCTION_DATABASE_BOOTSTRAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Related Repository

- Frontend: [victrium-rh-fichaje-web](https://github.com/mmateo9601/victrium-rh-fichaje-web)

## Project Structure

- `src/modules`
- `src/common`
- `src/config`
- `src/database`
- `src/seed`
- `docs`
- `test`
- `scripts`

## Publication Notes

- No Docker files or Docker scripts are included.
- `synchronize` stays disabled.
- Database migrations are the canonical schema mechanism.
- The repository is ready for GitHub publication with a clear environment contract and deployment checklist.
