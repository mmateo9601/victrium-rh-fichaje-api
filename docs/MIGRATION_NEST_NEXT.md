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
- Autenticacion preparada para multiples clientes
- Sin Docker en los repos nuevos

## Estado

Documento inicial de trabajo para la migracion. La implementacion funcional se ira completando por dominios.
