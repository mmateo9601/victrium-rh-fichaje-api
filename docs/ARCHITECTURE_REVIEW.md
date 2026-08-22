# Architecture Review

Date: 2026-08-22

## Scope

Reviewed the API and frontend architecture against the current domain sources of truth:

- `victrium_workforce_uml.excalidraw`
- `docs/UML_IMPLEMENTATION_MATRIX.md`
- `docs/ROLE_ACCESS_MATRIX.md`
- `docs/SCHEDULING_DOMAIN.md`
- `docs/SETTINGS_DOMAIN.md`
- `docs/SHIFTS_DOMAIN.md`

## Architecture Health

Overall health is `amber`.

The codebase already follows the intended backbone:

- NestJS modular monolith in the API.
- Next.js feature-oriented frontend.
- TypeORM with migrations and `synchronize=false`.
- Backend as the authority for schedule, eligibility and tenant scoping.

The main architectural risk is not missing infrastructure. It is model drift:

- the docs describe a richer and slightly different domain than the code actually exposes;
- some concepts are split across multiple entities or services without an explicit boundary;
- the frontend still computes some schedule summaries that are also computed in the API;
- legacy duplicate entry points still exist in `src/auth` and `src/health`.

## Gaps

1. The UML and domain docs mention concepts that do not exist as first-class code constructs.
2. `ROLE_ACCESS_MATRIX` is aligned with the current `RoleName` enum, but navigation and role-aware UX still need to stay synchronized with future role changes.
3. `ScheduleAssignment`, `PolicyResolver`, `ClockEligibility` and `AutoClose` are not implemented as dedicated modules even though they appear in the target model.
4. `CompanyEntity.workPolicy` is a JSON blob, so policy validation is implicit instead of schema-driven.
5. `TimeEntryEntity`, `TimeEntrySessionEntity` and `TimeEntryBreakEntity` form a practical attendance model, but there is no explicit event model for attendance transitions.

## Duplications

1. `src/auth/*` duplicates `src/modules/auth/*` as empty or legacy stubs.
2. `src/health/*` duplicates `src/modules/health/*` as legacy stubs.
3. Employee and user data are mirrored in both `UserEntity` and `EmployeeEntity`.
4. Schedule summary calculations exist in the API and again in the frontend `src/lib/schedule-metrics.ts`.
5. Worked-time heuristics also exist in the frontend `src/lib/time-analytics.ts`, which should remain presentation-only.

## Risks

1. Role drift risk:
   - documentation and frontend navigation can drift if new roles are introduced without updating the matrices;
   - frontend navigation can become inconsistent with backend authorization.
2. Tenant leakage risk:
   - scoping is centralized in `TenantScopeService`, but multiple services still need to remember to call it.
3. Policy drift risk:
   - `workPolicy` is JSON and can diverge without a schema contract or migration note.
4. Resolver complexity risk:
   - the schedule resolver is doing too much and can become the place where unrelated rules accumulate.
5. Dual source of truth risk:
   - mirrored employee/user fields can diverge if future writes bypass the current sync logic.

## Required Changes

1. Canonicalize the API module tree so `src/modules/*` is the only supported application surface.
2. Update docs and frontend navigation to use the backend role enum as the source of truth.
3. Freeze the scheduling authority in the backend and keep the frontend to presentation and filtering only.
4. Treat `UserEntity` and `EmployeeEntity` as distinct but synchronized aggregates, with explicit ownership rules.
5. Document policy shape and versioning before adding more `workPolicy` keys.
6. Add tests around the legacy duplication risk areas, especially authorization and schedule resolution.

## ADRs

- `docs/adr/005-canonical-module-boundaries.md`
- `docs/adr/006-role-taxonomy-source-of-truth.md`
- `docs/adr/007-scheduling-authority.md`
- `docs/adr/008-user-employee-boundary.md`

## Module Boundaries

### Identity

- `auth`
- `users`
- `api-keys`
- `roles` and `guards` in `common/auth`

### Organization and Settings

- `companies`
- `work-locations`
- `calendars`
- `common/tenant`
- `CompanyEntity.workPolicy`

### Workforce

- `employees`
- `employment-terms`
- `employee-location-assignments`

### Scheduling

- `shifts`
- `shift-assignments`
- `shift-overrides`
- `planning-periods`
- `work-schedule-resolver.service.ts`

### Attendance

- `time-entries`
- `time-entry-session`
- `time-entry-break`
- `time-entry-audit`
- `time-entry-eligibility.service.ts`

### Absences

- `vacations`
- `permissions`
- `incidents`

### Reporting

- `reports`

### Shared Infrastructure

- `database`
- `pagination`
- `errors`
- `logging`
- `time`
- `swagger`

## Status

The architecture is close to the intended target, but it is not yet fully normalized.

The next stabilization step is not feature work. It is making the boundaries explicit so that the docs, API, frontend and database stop drifting apart.
