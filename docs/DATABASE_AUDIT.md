# Database Audit

Date: 2026-08-22

## Schema

The current TypeORM model covers the requested aggregates:

- `Company`
- `WorkLocation`
- `User`
- `Employee`
- `EmploymentTerms`
- `Shift`
- `ShiftDay`
- `ShiftSegment` stored as JSON inside `ShiftDay`
- `RotationPattern` stored as JSON inside `Shift`
- `ScheduleAssignment`
- `ScheduleOverride`
- `WorkTimePolicy` stored as JSON inside `Company`
- `TimeEntry`
- `TimeEntryBreak`
- `TimeEntryEvent` modeled through `TimeEntry`, `TimeEntrySession`, and audits
- `Vacation`
- `Permission`
- `Incident`
- `AuditLog` is still split by bounded context

The schema now treats calendars as company-scoped instead of globally unique.

## Migrations

Schema changes are applied through migrations only.

Relevant migration set:

- `1724172000000-CreateApiKeysTable`
- `1724172100000-CreateTimeEntrySessionsTable`
- `1724172200000-CreateShiftsTables`
- `1724172300000-CreateWorkLocationsTables`
- `1724172400000-AddWorkLocationToShiftAssignments`
- `1724172500000-CreatePlanningPeriodsTable`
- `1724172600000-CreatePlanningPeriodAuditsTable`
- `1724172700000-AddShiftDaySegments`
- `1724172800000-AddShiftRotationColumns`
- `1724172900000-CreateEmploymentTermsTable`
- `1724173000000-AddWorkLocationToShiftOverrides`
- `1724173100000-AddCompanyDefaultCalendar`
- `1724173200000-AddEmployeePrimaryWorkLocation`
- `1724173300000-HardenDatabaseIntegrity`

`synchronize` remains disabled.

## Indexes

Added or reinforced company-aware and history-oriented indexes:

- `calendarios(company_id, nombre)` unique
- `calendarios(company_id, year)` unique
- `dias_laborables(calendario_id, dia)` unique
- `turno_dias(shift_id, day_of_week)` unique
- `turno_overrides(employee_id, date)` unique
- `employee_location_assignments(company_id, employee_id, valid_from, valid_to)`
- `employees(id, company_id)` unique support key
- `turnos(id, company_id)` unique support key
- `work_locations(id, company_id)` unique support key
- `usuarios(id, company_id)` unique support key

Existing indexes for common list and lookup paths remain in place.

## Constraints

Enforced at the database level:

- unique company codes and names where required
- unique schedule override per employee/day
- unique shift day per shift/day-of-week
- one active break per time-entry session
- historical date validity checks on assignments and terms
- enum-like value checks for planning periods, audits, vacations, permissions, shifts, and time entry state
- same-company foreign keys for the non-null company-scoped relationships:
  - `employee_location_assignments`
  - `turno_asignaciones`
  - `turno_overrides`
  - `employment_terms`
  - `vacaciones`
  - `permisos`
  - `incidencias`
  - `api_keys`

Relations that are nullable because of `SET NULL` delete behavior remain primarily application-validated:

- company default calendars
- employee primary work locations
- work-location calendar links
- employee calendar links
- shift override work-location links
- shift assignment work-location links
- user-to-employee mirroring

## Data Integrity

The model now protects:

- overlap-sensitive historical rows from malformed date ranges
- duplicate shift/day and override rows
- multiple simultaneous breaks in one session
- cross-company rows for the core non-null tenant-owned aggregates
- invalid lifecycle states for planning, attendance, vacations, permissions, and incidents

## Performance

The schema keeps the existing access-pattern indexes for:

- company-scoped lists
- employee history lookups
- shift assignment resolution
- attendance lookups by user/date/time

The new composite indexes align with the resolver and tenant-scoped list queries used by the API.

## Risks

- Some nullable relations still depend on application validation because `SET NULL` delete semantics do not combine cleanly with strict same-company foreign keys in MySQL.
- `AuditLog` is still split into bounded-context audit tables rather than a single global stream.
- Existing production data must already satisfy the new checks and uniqueness rules before the migration runs.
- Calendar records are now company-scoped, so any legacy assumptions about global year/name uniqueness are no longer valid.
