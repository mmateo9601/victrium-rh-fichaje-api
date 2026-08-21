# Migracion NestJS + Next.js

## Arquitectura original

- Backend Spring Boot con MySQL
- Frontend Angular
- App de escritorio Java

## Arquitectura nueva

- `victrium-rh-fichaje-api`: NestJS + TypeScript + MySQL
- `victrium-rh-fichaje-web`: Next.js + React + TypeScript

## Decisiones tecnicas

- API versionada en `/api/v1`
- Swagger en `/api/docs`
- Autenticacion con JWT access/refresh y sesiones persistidas
- `User` representa identidad
- `Employee` representa perfil laboral
- `Company` representa tenant organizativo
- El scope multiempresa se deriva del usuario autenticado, no del frontend
- Sin Docker en los repos nuevos
- `ROLE_SUPER_ADMIN` separa la capa plataforma de la capa compañía; `ROLE_ADMIN` se usa como admin de empresa
- El dominio de turnos vive en `/api/v1/shifts`, `/api/v1/shift-assignments` y `/api/v1/schedule`, con vista propia en Next.js para planificación, calendario personal y detalle de turno
- Los centros de trabajo viven en `/api/v1/work-locations` y permiten histórico de movilidad por empleado

## Estado

La base de auth, fichajes, `companies/users/employees`, `work locations`, `vacations`, `incidents`, `calendars`, `api keys`, `profile` y `turnos` ya están conectadas.
El ciclo de fichajes ha avanzado hasta `clock -> listado -> detalle -> corrección -> auditoría` con control de versión y tenant.
Quedan por continuar los dominios funcionales de negocio que dependen de esa base.
