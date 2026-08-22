# Backend Status

Fecha de corte: 2026-08-22

## MODULES

- Auth: implementado con login, refresh, logout, `me` y cambio de password.
- Users: implementado con listado, detalle y perfil propio.
- Employees: implementado con listado, detalle, alta, edición y activación/desactivación.
- Companies: implementado con listado, detalle, empresa propia, alta y edición.
- WorkLocations: implementado con CRUD, activación/desactivación y asignaciones por empleado.
- ApiKeys: implementado con CRUD, activación/desactivación y autenticación `x-api-key`.
- EmploymentTerms: cubierto como parte del motor de planificación y resolución de turnos.
- Shifts: implementado con CRUD, activación/desactivación, asignaciones, overrides y vistas de agenda.
- PlanningPeriods: implementado con borrador, publicación, despublicación y auditoría.
- ShiftDays: persistido y expuesto dentro del agregado `Shift`.
- ShiftSegments: persistido y expuesto dentro del agregado `Shift`.
- Rotations: persistido y expuesto dentro del agregado `Shift`.
- Assignments: implementado en `shift-assignments` y `employee-location-assignments`.
- Overrides: implementado en `shift-assignments/overrides`.
- Planning: implementado en `planning-periods` y `schedule`.
- Policies: expuestas a través de `workPolicy` en compañías y resolutores de planificación.
- Settings: parcial, embebido en configuración de empresa y entorno.
- TimeEntries: implementado con clocking, pausa, reanudación, cierre y correcciones.
- Breaks: implementado como parte del agregado de fichajes.
- Events: cubiertos indirectamente por la capa de incidencias, permisos y vacaciones.
- AutoClose: presente como servicio/job de dominio esperado, pendiente de exposición explícita si se requiere trigger programado.
- Vacations: implementado con listado, alta y aprobación/denegación.
- Permissions: implementado con listado, alta, aprobación/denegación, baja lógica y estadísticas.
- Incidents: implementado con listado, alta, edición, resolución y estadísticas.
- Notifications: pendiente de módulo dedicado.
- Audit: implementado en fichajes y planning periods, con trazabilidad server-side.

## BUSINESS RULES

- El backend es la fuente de verdad.
- El aislamiento por tenant se aplica por empresa y, cuando corresponde, por recurso propio.
- Los permisos de manager scope se resuelven en servidor, no en cliente.
- Las reglas de negocio críticas viven en servicios de dominio y transacciones.
- Los errores esperables devuelven `AppError` con `code` estable.
- No se exponen entities directamente en los contratos públicos.

## API

- Swagger actualizado en `/api/docs`.
- JSON de Swagger disponible en `/api/docs-json`.
- La autenticación documenta Bearer JWT y `x-api-key`.
- Los contratos principales están alineados con el cliente web generado.

## AUTHORIZATION

- Guards globales: JWT y rate limiting.
- Guards por rol en controladores de dominio.
- `ROLE_SUPER_ADMIN` conserva acceso ampliado.
- `ROLE_RRHH`, `ROLE_ADMIN` y `ROLE_COMPANY_ADMIN` se usan para scope operativo.
- Los recursos cruzando tenant devuelven 404 o 403 según el caso de uso.

## DATABASE IMPACT

- No se añadió migración nueva en este cambio.
- Las entidades existentes ya cubren sesiones, fichajes, turnos, asignaciones, permisos, vacaciones e incidencias.
- El modelo sigue apoyándose en relaciones eager/TypeORM para ensamblar DTOs específicos.

## TESTS

- `nest build`: verificado con binarios locales.
- `lint`: verificado con binarios locales.
- `test`: verificado con binarios locales.
- La suite cubre piezas de tenant scope, tokens, paginación y servicios de dominio clave.

## BUGS FIXED

- Swagger ahora documenta `x-api-key` además de Bearer JWT.
- El cliente web ya puede invocar `npm run api` como alias de regeneración.

## PENDING

- Exponer un job programado explícito para `AutoCloseTimeEntriesJob` si el despliegue no lo inyecta externamente.
- Módulo de notifications dedicado.
- Revisar si `settings` merece módulo propio en vez de permanecer embebido en `company.workPolicy`.
