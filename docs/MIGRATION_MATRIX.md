# Migration Matrix

| Funcionalidad | Código Spring original | Endpoint original | Endpoint NestJS nuevo | Pantalla Angular | Pantalla Next.js | Estado | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Healthcheck | `TestController` | `GET /test` | `GET /api/v1/health` | N/A | N/A | IMPLEMENTED | Verifica API y DB cuando hay conexion |
| Login | `AuthController` | `POST /auth/login` | `POST /api/v1/auth/login` | Login public | Login web | IMPLEMENTED | JWT access/refresh preparado |
| Refresh/logout | `AuthController` | N/A | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | N/A | N/A | IMPLEMENTED | Sesiones persistidas con hash |
| Usuario actual | `UsuarioController` | `GET /usuario/miusuario` | `GET /api/v1/auth/me` | Home/Intranet | Session provider | IMPLEMENTED | Basado en JWT |
| Fichajes clock | `FichajeController` | `POST /fichaje/now` | `POST /api/v1/time-entries/clock` | Fichajes | Fichajes | IMPLEMENTED | Alterna entrada/salida segun estado |
| Fichajes listados | `FichajeController` | `POST /fichaje/pagesFiltered` | `GET /api/v1/time-entries` | Fichajes | Fichajes | IN_PROGRESS | Paginacion base activa |
| Fichajes propios | `FichajeController` | `POST /fichaje/listFiltered` | `GET /api/v1/time-entries/me` | Home | Dashboard | IN_PROGRESS | Filtro por usuario autenticado |
| Vacaciones | `VacacionesController` | `/vacaciones/*` | `/api/v1/vacations/*` | Vacaciones | Vacations | PENDING | Pendiente de migracion completa |
| Permisos | `PermisosController` | `/permiso/*` | `/api/v1/permissions/*` | Permisos | Permissions | PENDING | Pendiente de migracion completa |
| Incidencias | `IncidenciaController` | `/incidencia/*` | `/api/v1/incidents/*` | Incidencias | Incidents | PENDING | Pendiente de migracion completa |
| Calendario | `CalendarioController` | `/calendario/*` | `/api/v1/calendars/*` | Calendario | Calendar | PENDING | Pendiente de migracion completa |
| Empleados | `UsuarioController` + related | `/usuario/*` | `/api/v1/users/*` | Empleados | Employees | PENDING | Pendiente de migracion completa |
