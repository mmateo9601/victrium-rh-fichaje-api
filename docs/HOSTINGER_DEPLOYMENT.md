# Hostinger Deployment

This project uses explicit deploy steps so production never depends on automatic schema creation inside `main.ts`.

## Required Flow

1. Install dependencies
2. Build the API
3. Show pending migrations
4. Run migrations
5. Bootstrap the super admin if enabled
6. Start the compiled API

## Commands

```bash
npm ci
npm run build
npm run migration:show
npm run migration:run
npm run bootstrap:super-admin
npm run start:prod
```

## Recommended Deploy Helper

If Hostinger provides a pre-start or deploy hook, use:

```bash
npm run deploy:prepare
```

That command runs:

1. `npm run migration:run`
2. `npm run bootstrap:super-admin`

It does not start the API process.

## Environment Variables

Set these variables in Hostinger:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL` or `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGINS`
- `LOG_LEVEL`
- `TRUST_PROXY`
- `SWAGGER_ENABLED`

For first bootstrap only:

- `BOOTSTRAP_SUPER_ADMIN=true`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_NAME` if you want a custom display name

After the first successful bootstrap, set:

- `BOOTSTRAP_SUPER_ADMIN=false`

and remove the bootstrap password from the environment if you no longer need it.

## Start Command

Production start remains:

```bash
npm run start:prod
```

That command only starts the compiled app from `dist/`.

## Failure Policy

- If migration fails, deployment must fail.
- If bootstrap fails while enabled, deployment must fail.
- The API must not start over an incompatible schema.

