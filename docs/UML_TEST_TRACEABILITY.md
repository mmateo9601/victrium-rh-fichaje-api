# UML Test Traceability

This document links the UML-backed behaviors to the tests and validation paths used in the API.

## Automated coverage

| Area | Validation |
| --- | --- |
| Auth and role guards | Unit and integration tests under `src/modules/auth`, `src/common/auth`, and controller guards |
| Employee lifecycle | Service tests for `employees.service.spec.ts` and controller-level authorization tests |
| Company and location scope | Service tests for company/work-location modules and tenant-scope helpers |
| Scheduling resolution | `src/modules/shifts/work-schedule-resolver.service.spec.ts` |
| Time entry flows | Time-entry and audit service tests |
| Reporting | Report service tests |
| Seed bootstrap | Development seed execution path exercised during local reset/bootstrap |

## Validation steps used for this update

- TypeScript compilation through `nest build`
- Jest suite through `jest --runInBand`
- Lint passes already present in the repository pipeline
- Seed-aware paths verified against the current schema and relations

## Manual checks recommended for the UML contract

- create company with and without default calendar
- create employee with and without primary work location
- confirm company- and employee-scoped reads under each role
- validate schedule resolution when primary work location changes
- validate clock pause/resume and audit entries

## Traceability outcome

The API now exposes the UML-relevant relations needed by the frontend:

- company default calendar
- employee primary work location
- company-scoped planning, scheduling, and attendance data

That keeps the model consistent from persistence to API payloads.
