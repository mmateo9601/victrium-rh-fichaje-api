# Production Database Bootstrap

This repository no longer relies on `synchronize`, `dropSchema`, or development seed data to start in production.

## Root Cause

The production deployment was starting from an empty MySQL database while the migration set only covered feature tables. The base schema for platform data was missing, so migrations could not build a usable database from zero and the initial `SUPER_ADMIN` could not be created in a reproducible way.

## Current Architecture

The schema now boots in two explicit phases:

1. `npm run migration:run`
2. `npm run bootstrap:super-admin`

The first step creates the database schema from an empty MySQL instance. The second step creates the platform `ROLE_SUPER_ADMIN` user when bootstrap is enabled.

## Migration Chain

The first migration creates the base schema required by the remaining migrations:

- `roles`
- `companies`
- `calendarios`
- `dias_laborables`
- `employees`
- `usuarios`
- `usuario_rol`
- `time_entry_sessions`
- `time_entry_breaks`
- `fichajes`
- `fichaje_audits`
- `vacaciones`
- `permisos`
- `incidencias`
- `auth_sessions`

Later migrations then add the rest of the domain tables and hardening constraints:

- shifts
- work locations
- planning periods
- api keys
- employment terms
- integrity checks

## Commands

Run the production-ready flow in this order:

```bash
npm ci
npm run build
npm run migration:show
npm run migration:run
npm run bootstrap:super-admin
npm run start:prod
```

For deploy preparation without starting the API:

```bash
npm run deploy:prepare
```

## Idempotency

- `npm run migration:run` is safe to run on an already migrated database.
- `npm run bootstrap:super-admin` is safe to run repeatedly when the bootstrap account already exists with `ROLE_SUPER_ADMIN`.
- If a user already exists with the bootstrap email but does not have `ROLE_SUPER_ADMIN`, the command fails explicitly instead of escalating silently.

## Production Rules

- `synchronize` stays disabled.
- `dropSchema` stays disabled.
- Bootstrap credentials are server-side only.
- The bootstrap password is never logged.

## Verification Target

The production verification target is:

1. blank MySQL database
2. `npm run migration:run`
3. `npm run bootstrap:super-admin`
4. login with the bootstrap account
5. `GET /api/v1/auth/me`
