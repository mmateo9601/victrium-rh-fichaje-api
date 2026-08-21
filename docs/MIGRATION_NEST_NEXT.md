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

## Estado

La base de auth, fichajes, `companies/users/employees`, `vacations`, `incidents`, `calendars`, `api keys` y `profile` ya están conectadas.
El ciclo de fichajes ha avanzado hasta `clock -> listado -> detalle -> corrección -> auditoría` con control de versión y tenant.
Quedan por continuar los dominios funcionales de negocio que dependen de esa base.
