# Ideal Product Architecture

## Vision

Build a workforce planning and timekeeping platform that supports Spanish organizations from a single-site SME to a multi-company, multi-location operation with rotas, legal rules, attendance, and auditability.

## Core domains

- Identity and access
- Company tenant hierarchy
- Work locations
- Employee employment context
- Calendars and holidays
- Work policies and legal configuration
- Shifts and shift segments
- Planning periods and publication
- Timekeeping and corrections
- Absences and incidents
- Audit and reporting

## Hierarchy

- `SUPER_ADMIN`
  - platform-wide access
  - creates and configures companies
  - switches context into a company
  - sees global metrics and audit
- `COMPANY_ADMIN`
  - company-wide administration
  - manages work locations, calendars, policies, and users
- `RRHH`
  - operational HR configuration
  - manages employees, shifts, assignments, planning and exceptions
- `MANAGER`
  - operational visibility over a team or location if enabled by policy
- `EMPLOYEE`
  - self-service schedule, calendar, timekeeping and requests

## Location model

Company owns many work locations.

Each employee can have:

- a primary work location;
- one or more temporary assignments;
- a history of location changes.

Planning must be able to bind a shift to a work location without forcing that same location as the actual clock-in point unless a policy explicitly requires it.

## Scheduling model

The ideal scheduler should support:

- weekly shift templates;
- split shifts;
- cross-midnight shifts;
- rotating patterns;
- planning periods;
- draft and publish workflow;
- overrides;
- absences;
- holiday awareness;
- location-aware planning.

## Policy model

Labor rules should be configurable per company and, where needed, per location, contract, or collective agreement.

Examples:

- maximum daily duration;
- minimum rest between shifts;
- weekly rest;
- mandatory pauses;
- tolerance windows;
- flexible attendance windows;
- night work rules;
- overtime policy;
- distribution irregular of the working day;
- retention requirements.

## Timekeeping model

The register of the day must preserve:

- start
- finish
- pauses
- effective working time
- corrections
- reason for the correction
- actor who changed it
- timestamps

Operational data should be auditable and not silently overwritten.

## UX model

- Platform area for super admin
- Company administration area
- Operations area for RRHH and managers
- Employee self-service area

The navigation should reflect the current context explicitly so the user knows whether they are acting as platform admin or company user.

