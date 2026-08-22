# UML Implementation Matrix

This matrix maps the core UML domain model to the current API implementation.

| UML area | Main entities / modules | API coverage | Notes |
| --- | --- | --- | --- |
| Multitenant organization | `CompanyEntity`, `WorkLocationEntity`, `CalendarEntity`, `CalendarDayEntity` | Implemented | Companies, calendars, default calendar relation, work locations, company-scoped queries |
| Identity and roles | `UserEntity`, `RoleEntity`, `RoleName`, auth sessions, API keys | Implemented | Role-aware auth for web, mobile and desktop |
| Workforce directory | `EmployeeEntity`, `EmploymentTermsEntity`, employee-location assignments | Implemented | Employee profile, primary work location, contract history |
| Scheduling | `ShiftEntity`, `ShiftDayEntity`, `ShiftSegment`, `ShiftAssignmentEntity`, `ShiftOverrideEntity`, schedule resolver | Implemented | Rotation, overrides, effective schedule resolution |
| Time and attendance | `TimeEntryEntity`, `TimeEntrySessionEntity`, `TimeEntryBreakEntity`, `TimeEntryAuditEntity` | Implemented | Clock-in/out, pause/resume, audit trail |
| Absences and incidents | `VacationEntity`, `PermissionEntity`, `IncidentEntity` | Implemented | Status-based life cycle and reporting hooks |
| Planning periods | `PlanningPeriodEntity`, `PlanningPeriodAuditEntity` | Implemented | Draft/published cycles and traceability |
| Policies and settings | `CompanyEntity.workPolicy`, calendar tolerances, operational limits | Implemented | Configurable by tenant, used by schedule and time-entry rules |
| Reporting | `reports` module | Implemented | Aggregated workforce and attendance views |

## Current schema additions

- `companies.default_calendar_id`
- `employees.primary_work_location_id`

These columns align the persisted model with the UML contract and are included in migrations.

## Delivery status

Core production flows are covered end to end in the API:

- authentication and tenant scoping
- companies and work locations
- employees and employment terms
- schedules, shifts, and overrides
- time entries, breaks, and audits
- absences, permissions, and incidents
- reports and operational summaries
