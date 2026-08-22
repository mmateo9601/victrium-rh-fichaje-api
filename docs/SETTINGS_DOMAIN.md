# Settings Domain

The settings domain groups the tenant-level configuration that shapes attendance and scheduling.

## Coverage

- company profile and code
- company timezone
- company work policy payload
- default company calendar
- calendar tolerances and holiday definitions
- work location calendar assignment

## Runtime impact

- determines daily tolerance windows for clock-in and clock-out
- feeds the schedule resolver with tenant policy values
- drives reports, validations, and time-entry warnings

## Current API model

- `CompanyEntity.workPolicy`
- `CompanyEntity.timezone`
- `CompanyEntity.defaultCalendar`
- `CompanyEntity.defaultCalendarId`
- `CalendarEntity`
- `CalendarDayEntity`
- `WorkLocationEntity.calendar`

## Operational guidance

- keep configuration tenant-scoped
- prefer explicit migrations for any new settings column
- update the seed when new policy fields are added so demo data remains coherent
