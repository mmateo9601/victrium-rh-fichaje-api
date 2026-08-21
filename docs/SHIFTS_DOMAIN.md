# Shifts Domain

## Purpose

This domain adds work scheduling on top of the existing attendance and employee model.

It covers:

- reusable shift templates;
- day-by-day shift definitions;
- employee shift assignments with validity windows;
- one-off overrides for special dates;
- schedule queries for the organization and for each employee.

## API surface

- `GET /api/v1/shifts`
- `GET /api/v1/shifts/:id`
- `POST /api/v1/shifts`
- `PATCH /api/v1/shifts/:id`
- `POST /api/v1/shifts/:id/activate`
- `POST /api/v1/shifts/:id/deactivate`
- `GET /api/v1/shifts/me`
- `GET /api/v1/shifts/:id/assignments`
- `GET /api/v1/shift-assignments`
- `POST /api/v1/shift-assignments`
- `PATCH /api/v1/shift-assignments/:id`
- `GET /api/v1/shift-assignments/overrides`
- `POST /api/v1/shift-assignments/overrides`
- `PATCH /api/v1/shift-assignments/overrides/:id`
- `GET /api/v1/schedule`
- `GET /api/v1/schedule/me`
- `GET /api/v1/employees/:id/schedule`
- `GET /api/v1/employees/:id/shifts`

## Data model

- `turnos` stores the shift template.
- `turno_dias` stores weekly rules for each day of the week.
- `turno_asignaciones` links employees to a shift during a validity window.
- `turno_overrides` stores exceptions for a specific date.

## Notes

- The module is tenant-aware.
- Schedule responses combine shift planning with absences, permissions, incidents and time-entry activity.
- The healthcheck can be used to confirm API availability and database connectivity after deployment.
