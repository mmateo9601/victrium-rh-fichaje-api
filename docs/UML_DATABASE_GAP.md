# UML Database Gap

This document records the schema alignment between the UML and the current database model.

## Covered schema elements

- companies
- calendars and calendar days
- users and roles
- employees
- employment terms
- work locations and location assignments
- shifts, segments, assignments, and overrides
- planning periods and audits
- time entries, sessions, breaks, and audits
- vacations, permissions, and incidents

## Recent schema alignment

- added `companies.default_calendar_id`
- added `employees.primary_work_location_id`

## Current assessment

The active delivery path is schema-complete for the workforce management flows implemented in the API. The database now exposes the company and employee relations required by the UML-backed tenant model, scheduling engine, and employment context.

## Notes

- The schema is managed through explicit migrations.
- The seed has been updated to create coherent data for multiple companies, calendars, work locations, and employee assignment history.
- Foreign keys use `SET NULL` where the UML expects optional ownership and `RESTRICT` / `CASCADE` where the domain requires integrity.
