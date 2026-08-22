# Backend Production Readiness

## Commit

- Not committed in this session.

## Required Env Names

- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`
- `SWAGGER_ENABLED`
- `TRUST_PROXY`
- `DATABASE_URL` or `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGINS`
- `TZ`

## Migration Strategy

- Migrations are explicit and reproducible through TypeORM CLI.
- Commands:
  - `npm run migration:show`
  - `npm run migration:run`
  - `npm run migration:revert`
- The app does not auto-run migrations on startup.

## Build

- Uses `npm run build`.
- Compiles to `dist/`.
- `start:prod` runs the compiled entrypoint.

## Startup

- Environment validation fails fast through `createAppConfig`.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be different.
- Production CORS disallows localhost-style origins.
- Swagger can be disabled by env.

## Health

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

## Security Checks

- JWT and API key auth supported.
- Structured logging without `console.log`.
- `trust proxy` configurable.
- `x-api-key` documented in Swagger.
- Rate limiting hardened on login and refresh.

## Test Status

- Local backend checks have been re-run after the hardening changes, pending the final verification pass in this session.

## Deployment Verification

- Pending against a real Hostinger environment.
- Validate:
  - DB connectivity
  - readiness endpoint
  - Swagger policy
  - login/refresh
  - CORS origins

## Final Notes

- This backend is closer to production-safe, but a final validation pass should confirm migration commands and runtime startup with real environment variables.
