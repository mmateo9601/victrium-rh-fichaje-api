# Backend Configuration Audit

## ENV

- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`
- `SWAGGER_ENABLED`
- `TRUST_PROXY`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGINS`
- `TZ`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

## COMPANY SETTINGS

- `workPolicy` on `CompanyEntity`
- `timezone` on `CompanyEntity`
- `defaultCalendar` on `CompanyEntity`
- `timezone` on `WorkLocationEntity`

## PLATFORM SETTINGS

- `LOG_LEVEL`
- `SWAGGER_ENABLED`
- `TRUST_PROXY`
- `PORT`
- `CORS_ORIGINS`
- `TZ`
- Database connection parameters
- JWT signing secrets and expirations

## HARDCODED CONSTANTS

- Default API prefix `/api/v1`
- Default time zone fallback `Europe/Madrid`
- Default access token TTL `15m`
- Default refresh token TTL `7d`
- Global throttling window `60s` at `100` requests
- Seed command entrypoint names

## AUDIT NOTES

- No production secrets should be versioned.
- `.env` remains ignored and `.env.example` is the only tracked sample.
- Time-zone-sensitive business logic should keep using company or work-location time zones, not process-wide assumptions.
