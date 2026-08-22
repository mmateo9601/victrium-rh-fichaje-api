# QA Test Plan

Fecha: 2026-08-22

## Objetivo
Validar que la API cumple el baremo P0/P1 sin regresiones en auth, clock, roles, tenant y calculos de tiempo.

## Alcance
- Auth y autorizacion JWT/API key.
- Fichaje: inicio, pausa, reanudacion, fin y elegibilidad.
- Tenant isolation por company y self access.
- Roles: ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_COMPANY_ADMIN, ROLE_RRHH, ROLE_USER.
- Dominios P1: shifts, rotations, vacations, permissions, incidents, settings.

## Tipos de prueba
- unit
- integration
- API e2e
- black-box
- white-box
- boundary
- negative
- concurrency
- security

## Criterios de salida
- 0 blocker
- 0 critical
- 0 high
- build y lint verdes
- regresiones cubiertas con tests
