# Backend Production Env

| Variable | Required | Secret | Purpose | Example format | Build/Runtime |
|---|---|---:|---|---|---|
| `NODE_ENV` | Yes | No | Runtime mode validation | `development`, `test`, `production` | Runtime |
| `PORT` | Yes | No | HTTP port | `3001` | Runtime |
| `LOG_LEVEL` | No | No | Structured log verbosity | `error`, `warn`, `log`, `verbose`, `debug` | Runtime |
| `SWAGGER_ENABLED` | No | No | Enable Swagger UI in runtime | `true` / `false` | Runtime |
| `TRUST_PROXY` | No | No | Express proxy trust for Hostinger/reverse proxy | `true` / `false` | Runtime |
| `BOOTSTRAP_SUPER_ADMIN` | No | No | Enables the explicit super admin bootstrap command | `true` / `false` | Runtime |
| `SUPER_ADMIN_EMAIL` | Conditional | No | Bootstrap identity email when bootstrap is enabled | `YOUR_BOOTSTRAP_EMAIL` | Runtime |
| `SUPER_ADMIN_PASSWORD` | Conditional | Yes | Bootstrap password when bootstrap is enabled | `YOUR_BOOTSTRAP_PASSWORD` | Runtime |
| `SUPER_ADMIN_NAME` | No | No | Optional display name for the bootstrap account | `YOUR_BOOTSTRAP_NAME` | Runtime |
| `DATABASE_URL` | No | Yes | Single MySQL connection string | `mysql://user:pass@host:3306/db` | Runtime |
| `DB_HOST` | Conditional | No | MySQL host when not using `DATABASE_URL` | `YOUR_DB_HOST` | Runtime |
| `DB_PORT` | Conditional | No | MySQL port | `3306` | Runtime |
| `DB_NAME` | Conditional | No | MySQL database name | `YOUR_DB_NAME` | Runtime |
| `DB_USER` | Conditional | Yes | MySQL username | `YOUR_DB_USER` | Runtime |
| `DB_PASSWORD` | Conditional | Yes | MySQL password | `YOUR_DB_PASSWORD` | Runtime |
| `JWT_ACCESS_SECRET` | Yes | Yes | Access token signing secret | `YOUR_JWT_ACCESS_SECRET` | Runtime |
| `JWT_REFRESH_SECRET` | Yes | Yes | Refresh token signing secret | `YOUR_JWT_REFRESH_SECRET` | Runtime |
| `JWT_ACCESS_EXPIRES_IN` | Yes | No | Access token lifetime | `15m` | Runtime |
| `JWT_REFRESH_EXPIRES_IN` | Yes | No | Refresh token lifetime | `7d` | Runtime |
| `CORS_ORIGINS` | Yes | No | Allowed browser origins or safe subdomain patterns | comma-separated URLs / `https://*.example.com` | Runtime |
| `TZ` | No | No | Process timezone default | `Europe/Madrid` | Runtime |
| `SMTP_HOST` | No | Yes | SMTP server host | `YOUR_SMTP_HOST` | Runtime |
| `SMTP_PORT` | No | Yes | SMTP server port | `587` | Runtime |
| `SMTP_USER` | No | Yes | SMTP username | `YOUR_SMTP_USER` | Runtime |
| `SMTP_PASSWORD` | No | Yes | SMTP password | `YOUR_SMTP_PASSWORD` | Runtime |
| `SMTP_FROM` | No | No | Default sender address | `YOUR_SENDER_ADDRESS@example.com` | Runtime |

Notes:
- Prefer `DATABASE_URL` or split DB fields, not both in deployment docs.
- In production, `CORS_ORIGINS` entries for `localhost` or `127.0.0.1` are ignored during startup and should be removed from the final deployment config.
- Safe wildcard subdomain patterns such as `https://*.victriumtech.com` are supported.
- `SWAGGER_ENABLED` defaults to off in production.
- `BOOTSTRAP_SUPER_ADMIN=true` requires `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.
- The bootstrap password is used only by `npm run bootstrap:super-admin`; it is not printed to logs.
- Never commit real credentials, tokens, or production mail settings to the repository.
