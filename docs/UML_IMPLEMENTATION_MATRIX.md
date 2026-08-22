# UML Implementation Matrix

This matrix maps the target UML vocabulary to the current API codebase.

Status legend:

- `implemented`: there is a direct entity/module/service implementation.
- `partial`: the concept exists, but it is embedded in another aggregate or service.
- `missing`: no explicit implementation exists yet.

| UML concept | Current implementation | Status | Notes |
| --- | --- | --- | --- |
| `Company` | `CompanyEntity`, `CompaniesService` | implemented | Owns timezone, default calendar and `workPolicy` JSON. |
| `WorkLocation` | `WorkLocationEntity`, `WorkLocationsModule` | implemented | Company-scoped center with optional calendar and timezone. |
| `Employee` | `EmployeeEntity`, `EmployeesService` | implemented | Workforce profile. It mirrors some user fields by design. |
| `EmploymentTerms` | `EmploymentTermsEntity` | implemented | Versioned contract history with `policySnapshot` and primary work location. |
| `Shift` | `ShiftEntity`, `ShiftDayEntity`, `ShiftAssignmentEntity`, `ShiftOverrideEntity`, `ShiftsService`, `WorkScheduleResolverService` | implemented | Template, day rules, assignments and overrides are all present. |
| `ShiftDay` | `ShiftDayEntity` | implemented | Stored as a child entity of `Shift`. |
| `ShiftSegment` | `ShiftDayEntity.segments` JSON | partial | There is no dedicated table; segments are embedded JSON. |
| `RotationPattern` | `ShiftEntity.rotationPattern` JSON | partial | No standalone entity; pattern is resolved inside the shift service and resolver. |
| `ScheduleAssignment` | `ShiftAssignmentEntity` + `ShiftOverrideEntity` + resolver | partial | The UML concept is split across assignment and override aggregates. |
| `ScheduleOverride` | `ShiftOverrideEntity` | implemented | Date-specific exception with `SHIFT` and `OFF` modes. |
| `ScheduleResolver` | `WorkScheduleResolverService` | implemented | Calculates the effective schedule, policy evaluation and row summaries. |
| `WorkTimePolicy` | `CompanyEntity.workPolicy` JSON | partial | Policy exists, but it is schema-less JSON rather than a typed value object. |
| `PolicyResolver` | `TimeEntryEligibilityService` + `WorkScheduleResolverService` | partial | Policy resolution is distributed across two services. |
| `TimeEntry` | `TimeEntryEntity` | implemented | Canonical attendance line item. |
| `TimeEntryBreak` | `TimeEntryBreakEntity` | implemented | Session-level break history. |
| `TimeEntryEvent` | `TimeEntryEntity` + `TimeEntrySessionEntity` | partial | No separate event stream entity. Events are inferred from entries and sessions. |
| `ClockEligibility` | `TimeEntryEligibilityService`, `TimeEntryEligibilityDto` | implemented | Backend authority for clock-in rules. |
| `AutoClose` | `TimeEntriesService.finishSession` | partial | There is no standalone auto-close service or scheduler yet. |
| `Vacation` | `VacationEntity`, `VacationsService` | implemented | Status lifecycle and tenant scoping are present. |
| `Permission` | `PermissionEntity`, `PermissionsService` | implemented | Status lifecycle and tenant scoping are present. |
| `Incident` | `IncidentEntity`, `IncidentsService` | implemented | Operational incident record with reporting support. |
| `PlanningPeriod` | `PlanningPeriodEntity`, `PlanningPeriodAuditEntity`, `PlanningPeriodsService` | implemented | Draft/published lifecycle with audits. |
| `AuditLog` | `TimeEntryAuditEntity`, `PlanningPeriodAuditEntity` | partial | Audit exists by bounded context, not as a shared global audit stream. |

## Current schema additions

- `companies.default_calendar_id`
- `employees.primary_work_location_id`

These columns are already mapped in the ORM and included in migrations.

## Gaps To Track

- `ScheduleAssignment` is not a single canonical table or module.
- `WorkTimePolicy` is still untyped JSON and can drift without a schema contract.
- `ClockEligibility` is implemented, but only as backend read logic, not a reusable domain object.
- `AutoClose` is not yet a first-class automation boundary.
- The resolver is powerful, but it mixes schedule, absence, attendance and policy evaluation in one service.
