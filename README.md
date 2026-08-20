# victrium-rh-fichaje-api

API NestJS para la migracion de `fichaje-main` a un backend modular y versionado.

## Estado actual

- NestJS + TypeScript
- TypeORM + MySQL
- `/api/v1`
- Swagger en `/api/docs`
- Auth con JWT access/refresh
- Healthcheck real
- Primer vertical slice de fichajes
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
- `POST /api/v1/time-entries/clock`
- `GET /api/v1/time-entries`
- `GET /api/v1/time-entries/me`
- `GET /api/v1/time-entries/:id`
- `GET /api/v1/health`

## Documentacion

- [Migration matrix](docs/MIGRATION_MATRIX.md)
- [Nest/Next migration notes](docs/MIGRATION_NEST_NEXT.md)
- [ADR ORM](docs/adr/001-orm.md)
- [ADR authentication](docs/adr/002-authentication.md)
- [ADR multi-tenancy](docs/adr/003-multi-tenancy.md)
