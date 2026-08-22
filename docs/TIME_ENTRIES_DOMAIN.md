# Time Entries Domain

## Objetivo

Cerrar el flujo funcional de fichajes con lectura, detalle, corrección controlada y auditoría.

## Reglas

- `POST /api/v1/time-entries/clock` sigue alternando entrada y salida según el estado del usuario.
- `GET /api/v1/time-entries` queda reservado para `ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_COMPANY_ADMIN` y `ROLE_RRHH`.
- `GET /api/v1/time-entries/me` devuelve solo el histórico del usuario autenticado.
- `GET /api/v1/time-entries/me/current` devuelve la sesión actual con el snapshot de elegibilidad.
- `GET /api/v1/time-entries/me/eligibility` devuelve la elegibilidad calculada por backend.
- `GET /api/v1/time-entries/:id` permite ver el detalle del fichaje con control de acceso por usuario, RRHH o administración.
- `POST /api/v1/time-entries/:id/correction` aplica una corrección explícita sobre `dia`, `hora` y `tipo`.
- La corrección exige control de versión y registra una auditoría inmutable.
- `GET /api/v1/time-entries/:id/audits` devuelve el historial de correcciones del fichaje.

## Auditoría

Cada corrección guarda:

- valores anteriores;
- valores nuevos;
- versión anterior y nueva;
- motivo;
- usuario que corrige;
- fecha del cambio.

## Restricciones

- No existe `PATCH` genérico sobre la entidad de fichajes.
- No se admite infraestructura Docker en los repositorios nuevos.
- La API depende de MySQL externo o local configurado por variables de entorno.
