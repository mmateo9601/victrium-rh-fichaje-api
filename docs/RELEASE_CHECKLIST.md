# Release Checklist

Use this checklist before publishing the API repository.

## Source Control

- Working tree is clean.
- No real credentials are committed.
- `.env` is ignored and `.env.example` is the only committed environment template.

## Local Validation

```bash
npm ci
npm run lint
npm test
npm run test:e2e
npm run build
```

## Runtime Contract

- `CORS_ORIGINS` matches the deployed frontend domains.
- `DATABASE_URL` or `DB_*` is configured consistently.
- `BOOTSTRAP_SUPER_ADMIN` is documented and used only when needed.
- `SWAGGER_ENABLED` is aligned with the target environment.

## Production Readiness

- Migrations run successfully from an empty database.
- The super admin bootstrap is idempotent.
- The health endpoint returns a successful response.
- No Docker files or Docker-related scripts are included.
