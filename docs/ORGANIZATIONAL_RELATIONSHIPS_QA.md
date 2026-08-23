# Organizational Relationships QA

## Scope

This checklist verifies the tenant hierarchy:

- `Company`
- `WorkLocation`
- `Employee`
- `User`

## Required assertions

- `WorkLocation.companyId` is never null.
- `Employee.companyId` is never null.
- `Employee.primaryWorkLocationId` belongs to the same company as the employee.
- `User.companyId` matches the employee company when the user is company-scoped.
- `User.employeeId` cannot point to an employee from another company.
- `ROLE_SUPER_ADMIN` can act globally.
- `COMPANY_ADMIN`, `RRHH`, and `MANAGER` are constrained by tenant scope.
- `ROLE_USER` can only access self data or the related employee context.

## Negative tests

- Create a work location without company -> reject.
- Link an employee to a primary work location from another company -> reject.
- Link a user from company A to an employee from company B -> reject.
- Update a company-scoped user to a different company -> reject.
- Let RRHH create or update work locations in another company -> reject.

## Positive tests

- Super admin can create company, work location, employee and user.
- Company admin can manage only its own company resources.
- RRHH can read work locations and manage employees inside the tenant.
- Employee planning can move between locations without changing the employee primary location.

## Expected outputs

- No SQL or foreign-key errors are shown to the user.
- Tenant mismatches are translated into human-readable errors.
- Audit logs capture administrative changes with actor, target and company.
