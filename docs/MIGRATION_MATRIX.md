# Migration Matrix

| Funcionalidad | Código Spring / Angular original | Endpoint / flujo original | Endpoint NestJS nuevo | Pantalla Angular | Pantalla Next.js | Estado | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Healthcheck | `TestController` | `GET /test` | `GET /api/v1/health` | N/A | N/A | IMPLEMENTED | Verifica API y base de datos |
| Login | `AuthController` | `POST /auth/login` | `POST /api/v1/auth/login` | Login public | Login web | IMPLEMENTED | JWT access/refresh, sesiones persistidas |
| Refresh/logout | `AuthController` | N/A | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | N/A | N/A | IMPLEMENTED | Refresh hash + revocación de sesión |
| Usuario actual | `UsuarioController` | `GET /usuario/miusuario` | `GET /api/v1/auth/me`, `GET /api/v1/users/me` | Home/Intranet | Session provider | IMPLEMENTED | Basado en JWT |
| Empresas | No existía como entidad explícita | N/A | `GET /api/v1/companies`, `GET /api/v1/companies/me`, `POST /api/v1/companies`, `GET /api/v1/companies/:id`, `PATCH /api/v1/companies/:id` | N/A | Company admin | IMPLEMENTED | Nuevo root organizativo para tenant |
| Usuarios | `UsuarioController`, `AuthController` | `/usuario/*`, `/auth/*` | `GET /api/v1/users`, `GET /api/v1/users/:id`, `GET /api/v1/users/me` | Admin de empleados | Users | IMPLEMENTED | Identidad de acceso, sin exponer secretos |
| Empleados | `UsuarioController` + `src/app/intranet/empleados/*` | `/usuario/*` | `GET /api/v1/employees`, `GET /api/v1/employees/me`, `GET /api/v1/employees/:id`, `POST /api/v1/employees`, `PATCH /api/v1/employees/:id`, `PATCH /api/v1/employees/:id/activate`, `PATCH /api/v1/employees/:id/deactivate` | Empleados | Employees | IMPLEMENTED | Perfil laboral separado de `User` |
| Roles / RBAC | `Rol`, `RolNombre`, `MainSecurity` | `@PreAuthorize`, `hasRole(...)` | Roles en JWT + `JwtAuthGuard` + `RolesGuard` | Guards Angular | Guards / nav | IMPLEMENTED | Catálogo fijo `ROLE_ADMIN`, `ROLE_RRHH`, `ROLE_USER` |
| Permisos laborales | `PermisosController` | `/permiso/*` | N/A en esta fase | Permisos | Permissions | PENDING | Sigue siendo un dominio funcional pendiente de migración |
| Fichajes clock | `FichajeController` | `POST /fichaje/now` | `POST /api/v1/time-entries/clock` | Fichajes | Fichajes | IMPLEMENTED | Alterna entrada/salida según estado |
| Fichajes listados | `FichajeController` | `POST /fichaje/pagesFiltered` | `GET /api/v1/time-entries` | Fichajes | Fichajes | IN_PROGRESS | Paginación base activa |
| Fichajes propios | `FichajeController` | `POST /fichaje/listFiltered` | `GET /api/v1/time-entries/me` | Home | Dashboard | IN_PROGRESS | Filtro por usuario autenticado |
| Vacaciones | `VacacionesController` | `/vacaciones/*` | `/api/v1/vacations`, `/api/v1/vacations/me`, `/api/v1/vacations/:id`, `/api/v1/vacations/:id/approve`, `/api/v1/vacations/:id/deny` | Vacaciones | Vacations | IMPLEMENTED | Solicitudes propias y gestión RRHH |
| Incidencias | `IncidenciaController` | `/incidencia/*` | `/api/v1/incidents/*` | Incidencias | Incidents | PENDING | Pendiente de migración completa |
| Calendario | `CalendarioController` | `/calendario/*` | `/api/v1/calendars/*` | Calendario | Calendar | PENDING | Pendiente de migración completa |
