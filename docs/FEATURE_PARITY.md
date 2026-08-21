# Feature Parity

Este documento resume la paridad funcional entre el legado `fichaje-main` y la migración `victrium-rh-fichaje-api` + `victrium-rh-fichaje-web` con el estado actual del auditado.

| LEGACY | NEW | STATUS | NOTES |
| --- | --- | --- | --- |
| Login / JWT | `POST /api/v1/auth/login` | VERIFIED | Acceso con JWT access/refresh y sesión persistida |
| Usuario actual | `GET /api/v1/auth/me` y `GET /api/v1/users/me` | VERIFIED | Identidad y perfil visibles desde la API |
| Cambio de contraseña | `PATCH /api/v1/auth/password` | VERIFIED | Valida contraseña actual y revoca sesiones |
| Employees / Users | `GET/POST/PATCH /api/v1/employees`, `GET /api/v1/users` | VERIFIED | Separación de identidad y perfil laboral |
| Time entries | `clock`, listados, detalle, corrección, auditoría | VERIFIED | Flujo principal de fichaje ya operable |
| Vacations / Permissions / Incidents / Calendars | Módulos NestJS equivalentes | VERIFIED | CRUD funcional con tenant isolation y Swagger |
| Turnos / planificación | `GET/POST/PATCH /api/v1/shifts`, `/api/v1/shift-assignments`, `/api/v1/schedule` | VERIFIED | Asignaciones, excepciones y calendario mensual por empleado |
| API Keys | `GET/POST/PATCH/DELETE /api/v1/api-keys*` | VERIFIED | Claves hasheadas y autenticación por `X-API-KEY` |
| Profile / Cuenta | `GET /api/v1/auth/me`, `PATCH /api/v1/auth/password` | VERIFIED | La Web ya expone la cuenta y el cambio de contraseña autenticado |
| Landing pública Angular | Home Next.js | SUPERSEDED | La landing pública se sustituyó por la portada de Next |
| Registro público | N/A | SUPERSEDED | El alta queda canalizada por gestión administrativa |

## Estado del trabajo

- `VERIFIED`: funcionalidades ya implementadas y comprobadas.
- `SUPERSEDED`: funcionalidades del legado sustituidas por el nuevo modelo.
- `MISSING`: pendientes de implementar o confirmar en el resto del auditado.

El inventario completo continúa en `docs/MIGRATION_MATRIX.md`.
