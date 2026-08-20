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
| Permisos laborales | `PermisosController` | `/permiso/*` | `GET /api/v1/permissions`, `GET /api/v1/permissions/me`, `GET /api/v1/permissions/:id`, `POST /api/v1/permissions`, `PATCH /api/v1/permissions/:id/approve`, `PATCH /api/v1/permissions/:id/deny`, `DELETE /api/v1/permissions/:id`, `GET /api/v1/permissions/stats/*` | Permisos | Permissions | IMPLEMENTED | Solicitudes de permisos con aprobación, denegación y métricas |
| Fichajes clock | `FichajeController` | `POST /fichaje/now` | `POST /api/v1/time-entries/clock` | Fichajes | Fichajes | IMPLEMENTED | Alterna entrada/salida según estado |
| Fichajes listados | `FichajeController` | `POST /fichaje/pagesFiltered` | `GET /api/v1/time-entries` | Fichajes | Fichajes | IMPLEMENTED | Paginación y filtros por empresa/empleado |
| Fichajes propios | `FichajeController` | `POST /fichaje/listFiltered` | `GET /api/v1/time-entries/me` | Home | Dashboard | IMPLEMENTED | Filtro por usuario autenticado |
| Fichaje detalle | `FichajeController` | `GET /fichaje/{id}` | `GET /api/v1/time-entries/:id` | Fichajes | Fichajes | IMPLEMENTED | Acceso controlado por usuario/tenant |
| Fichaje corrección | `FichajeController` | `PUT /fichaje/{id}` | `POST /api/v1/time-entries/:id/correction` | Fichajes | Fichajes | IMPLEMENTED | Corrección explícita con control de versión |
| Fichaje auditoría | N/D | N/D | `GET /api/v1/time-entries/:id/audits` | N/D | Fichajes | IMPLEMENTED | Historial de cambios con usuario y motivo |
| Vacaciones | `VacacionesController` | `/vacaciones/*` | `/api/v1/vacations`, `/api/v1/vacations/me`, `/api/v1/vacations/:id`, `/api/v1/vacations/:id/approve`, `/api/v1/vacations/:id/deny` | Vacaciones | Vacations | IMPLEMENTED | Solicitudes propias y gestión RRHH |
| Incidencias | `IncidenciaController` | `/incidencia/*` | `/api/v1/incidents`, `/api/v1/incidents/me`, `/api/v1/incidents/:id`, `/api/v1/incidents/:id/resolve`, `/api/v1/incidents/stats/*` | Incidencias | Incidents | IMPLEMENTED | Listados, edición y métricas |
| Calendario | `CalendarioController` | `/calendario/*` | `GET /api/v1/calendars`, `GET /api/v1/calendars/list/dto`, `GET /api/v1/calendars/:id`, `POST /api/v1/calendars`, `PATCH /api/v1/calendars/:id`, `DELETE /api/v1/calendars/:id` | Calendario | Calendar | IMPLEMENTED | Calendarios y días laborables anidados |
