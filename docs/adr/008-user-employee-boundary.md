# ADR 008: User and Employee Are Distinct Aggregates

## Status

Accepted

## Context

The codebase currently mirrors several fields in both `UserEntity` and `EmployeeEntity`:

- `numero`
- `nombreEmpleado`
- `email`
- `dni`
- `working`
- `enVacaciones`
- `deBaja`
- `diasVacaciones`
- `horasGeneradas`

That duplication is intentional today, but it is easy to break if ownership is not explicit.

## Decision

- `UserEntity` is the authentication and authorization principal.
- `EmployeeEntity` is the workforce profile and operational record.
- Services may synchronize overlapping fields, but they must do so through explicit service logic, not ad hoc writes.
- `EmploymentTermsEntity` remains the history of contractual policy, not a replacement for employee state.

## Consequences

- The auth model and HR model stay separate.
- The team can reason about which aggregate owns which data.
- Sync bugs become easier to detect in tests and reviews.
- Future schema changes can be made without collapsing user and employee into a single overloaded table.
