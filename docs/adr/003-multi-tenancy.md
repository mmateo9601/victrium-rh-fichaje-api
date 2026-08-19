# Multi-tenancy

## Contexto

El modelo original no expone claramente una entidad empresa, pero la arquitectura futura debe tolerar multiempresa.

## Decisión

La API se diseña con limites de dominio y servicios filtrables por contexto de usuario, para poder introducir tenancy sin romper contratos.

## Alternativas consideradas

- Ignorar el problema
- Mezclar companyId en todos los endpoints sin control

## Consecuencias

- Se facilita añadir aislamiento por empresa cuando el esquema lo requiera.
- Los permisos y filtros se concentraran en backend.
