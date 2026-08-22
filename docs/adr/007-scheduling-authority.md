# ADR 007: Scheduling Authority Belongs to the Backend

## Status

Accepted

## Context

Scheduling, eligibility, policy evaluation and absence-aware day resolution are already implemented in the API through services such as:

- `WorkScheduleResolverService`
- `TimeEntryEligibilityService`
- `ShiftsService`

The frontend also computes derived schedule metrics for dashboard presentation.

## Decision

- The backend is the only authority for scheduling rules, clock eligibility and resolved schedule state.
- The frontend may compute presentation metrics, but it must not define business rules or eligibility decisions.
- Any future shared metric helpers must remain pure presentation helpers and must not become a second scheduling engine.

## Consequences

- Scheduling rules stay centralized.
- Cross-platform behavior remains consistent.
- The frontend becomes safer to evolve without risking business rule regressions.
- If metrics diverge, the backend response remains the source of truth.

