# Release Notes

## Current Delivery

This backend repository is organized as a corporate NestJS API for Victrium RH.

## What is Included

- Authentication and authorization services
- Multi-company domain model for users, companies, work locations, employees, shifts, and planning
- TypeORM migrations as the canonical database mechanism
- Swagger/OpenAPI documentation at `/api/docs`
- Production environment contract documented in `BACKEND_PRODUCTION_ENV.md`
- Database bootstrap guidance for deploying against an existing MySQL instance
- Cross-reference to the frontend repository

## Operational Notes

- The API expects external MySQL connectivity through environment variables.
- No Docker artifacts are stored in this repository.
- `synchronize` remains disabled; schema changes must go through migrations.
- Production bootstrap should preserve the super admin and existing operational data unless explicitly reset.

## Reviewer Checklist

- Install dependencies with `npm ci`
- Run lint, unit tests, e2e tests, and build before release
- Validate CORS and environment values for the deployed frontend domain
- Confirm migrations run cleanly against the target database

## Related Repositories

- Frontend: `victrium-rh-fichaje-web`

