# Organizational Model

## Canonical hierarchy

```text
SUPER_ADMIN
  └── COMPANY
        └── WORK_LOCATION / CENTRO
              └── EMPLOYEE
                    └── USER (identity)
```

## Domain rules

- `Company` is the tenant boundary.
- `WorkLocation` always belongs to exactly one `Company`.
- `Employee` always belongs to exactly one `Company`.
- `Employee.primaryWorkLocation` must belong to the same `Company` as the employee.
- `User` is the authentication identity.
- `User` may exist without an employee only for platform or administrative identities.
- `User` linked to a company-scoped role must belong to that company.
- `User` linked to `ROLE_USER` should normally be linked to an `Employee`.
- Cross-company links are rejected both in UI and backend.

## Business objects

### Company

- Tenant root for all operational data.
- Owns users, employees, calendars and work locations.
- Deletion is not physical by default; prefer `active=false` or archive flows.

### WorkLocation

- Centro de trabajo / physical or operational site.
- Fields:
  - `companyId`
  - `name`
  - `code`
  - `address`
  - `city`
  - `province`
  - `postalCode`
  - `timezone`
  - `calendarId`
  - `active`
- Unique constraints are scoped by company.

### Employee

- Labor profile for a person.
- Fields:
  - `companyId`
  - `primaryWorkLocationId`
  - personal and labor data
  - deactivation flags
- Can be scheduled in multiple locations through planning assignments.

### User

- Authentication identity.
- Fields:
  - `email`
  - `numero`
  - `passwordHash`
  - `companyId`
  - `employeeId`
  - `roles`
  - `active` state through `deBaja`
  - `lastLoginAt`
- Secrets are never exposed in DTOs.

## Relationship sketch

```text
Company 1 ─── N WorkLocation
Company 1 ─── N Employee
Company 1 ─── N User
Employee 1 ─── 1 User (optional, unique)
Employee N ─── 1 WorkLocation (primary, optional but company-bound)
```

## Security goals

- `ROLE_SUPER_ADMIN` can operate globally.
- Company-scoped roles can only operate inside their tenant.
- Cross-tenant updates are rejected in the service layer.
- `WorkLocation` and `Employee` creation always validate company ownership.

## Operational goals

- Keep planning flexible across work locations.
- Keep the primary work location independent from planning movement.
- Preserve attendance history when users or employees are deactivated.
