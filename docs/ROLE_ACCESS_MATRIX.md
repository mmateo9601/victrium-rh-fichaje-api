# Role Access Matrix

This matrix summarizes the API permissions expected by the workforce app.

| Role | Scope | Main capabilities |
| --- | --- | --- |
| `ROLE_SUPER_ADMIN` | All tenants | Full CRUD on companies, users, employees, work locations, calendars, schedules, policies, and integrations |
| `ROLE_COMPANY_ADMIN` | Own tenant | CRUD company users, employees, work locations, schedules, and operational configuration |
| `ROLE_RRHH` | Own tenant | HR operations, employee records, work-location read access, absences, permissions, incidents, and reporting |
| `ROLE_MANAGER` | Scoped tenant data | Read/write within assigned operational scope, without cross-tenant access |
| `ROLE_USER` | Own identity / own employee context | Self service, time entries, personal absences, and schedule views |
| `ROLE_AUDITOR` | Read-only scope defined by assignment | Auditing and reporting without write access |
| `ROLE_WORKFORCE_REPRESENTATIVE` | Read-only scope defined by assignment | Workforce representation and consultation without write access |

## Backend rules already enforced

- Tenant scoping is always applied before data access.
- `ROLE_SUPER_ADMIN` bypass is explicit and audited.
- Company-scoped users require `companyId`.
- Work locations cannot exist without a company.
- Employees cannot point to a primary work location from another company.
- User/employee cross-company links are rejected.
- Deactivation preserves historical data.

## Frontend alignment

The web navigation and forms must be filtered by role and scope so that each user only sees:

- the modules they can actually access
- the actions they can perform in the current tenant
- the correct mobile and desktop navigation state
- company-specific dropdowns, never global lists filtered only in the browser
