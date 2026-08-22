# ADR 005: Canonical Module Boundaries

## Status

Accepted

## Context

The API contains both canonical modules under `src/modules/*` and legacy or compatibility stubs under `src/auth/*` and `src/health/*`.

This creates a maintenance risk because future contributors can accidentally update the wrong entry point or infer that two implementations are valid.

## Decision

- Treat `src/modules/*` as the only canonical application surface.
- Treat top-level `src/auth/*` and `src/health/*` as legacy stubs unless they are explicitly removed or folded into the module tree.
- Keep shared infrastructure under `src/common/*` and persistence under `src/database/*`.
- Keep each bounded context responsible for its own module, controller, service and DTOs.

## Consequences

- The module graph becomes easier to reason about.
- Documentation and tests can refer to a single code path.
- Duplicate entry points stop looking like first-class architecture.
- Refactors can be done per bounded context without ambiguity.

