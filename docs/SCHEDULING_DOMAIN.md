# Scheduling Domain

## Purpose

The scheduling domain connects planning, work locations, shifts, absences and actual timekeeping.

## Implementation today

The current API surface is split across:

- `work-locations`
- `employee-location-assignments`
- `shifts`
- `shift-assignments`
- `planning-periods`
- `schedule`
- `time-entries`

## Concepts

- Work location
- Calendar
- Effective calendar
- Shift template
- Shift day
- Shift segment
- Shift assignment
- Shift override
- Planning period
- Draft planning
- Published planning
- Conflict detection
- Plan vs actual

## Recommended model

### Company

- owns locations, calendars, policies, users and employees

### WorkLocation

- represents a real work site or operational center
- can have its own calendar and timezone
- can be active or inactive

### EmployeeLocationAssignment

- tracks where an employee usually works
- supports historical changes

### Shift

- reusable template
- can be split into one or more segments per day

### PlanningPeriod

- groups schedules for a time window
- supports draft and publish
- stores versioning metadata

### ScheduleAssignment

- binds employee, shift, date range and optional location
- can be compared with actual timekeeping
- is represented across `shift-assignments`, `shift-assignments/overrides`, `planning-periods` and the schedule resolver

## Conflict checks

The domain should detect:

- overlapping assignments
- missing coverage
- rest conflicts
- holiday conflicts if policy requires it
- location mismatch if policy requires location-based attendance

## Employee views

- day view
- week view
- month view
- list/agenda fallback for accessibility

## Audit expectations

- planning changes should be traced
- publication should be auditable
- corrections should preserve the original state and store a reason
