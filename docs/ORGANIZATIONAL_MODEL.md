# Organizational Model

## What the original system showed

- `Usuario` concentrated authentication, employee-like personal data, attendance state and admin roles.
- The Angular frontend exposed a screen called `Empleado`, but it read and edited the `Usuario` backend record.
- `Permiso` in the legacy code is a leave request workflow, not a security permission catalog.
- No explicit `Empresa` entity appeared in the legacy codebase.
- Security was driven by Spring roles: `ROLE_ADMIN`, `ROLE_RRHH`, `ROLE_USER`.
- `ApiKey` existed as an alternate authentication path for RRHH-facing integrations.

## Current NestJS model

### Company

- Tenant root for the organization.
- Holds the boundary for data isolation.
- Can be active or inactive.
- One company has many users and many employees.

### User

- Authentication identity.
- Stores login data, password hash, role membership and current tenant link.
- Can exist without an employee profile.
- Can also be linked to an employee profile when the person has a labor record.

### Employee

- Labor profile.
- Stores work-state data such as vacation, working, and deactivation flags.
- Belongs to one company.
- Can exist without an account if the business decides to pre-register labor data.

### Roles

- Fixed security roles for the current migration:
  - `ROLE_ADMIN`
  - `ROLE_RRHH`
  - `ROLE_USER`
- Roles are authorization metadata, not a business domain CRUD.

### Permissions

- There is no separate access-permission catalog in the original code.
- The word `permiso` in the legacy project refers to leave requests.

## Relationship sketch

```text
Company
  ├── Users
  └── Employees
         └── User (optional link)
```

## Preserve vs improve

- Preserve:
  - role-based access
  - active/inactive semantics through business flags
  - existing auth/login/refresh flows
  - the distinction between identity and labor profile in public APIs
- Improve:
  - make tenant scope explicit
  - avoid exposing secrets in public DTOs
  - keep employee and identity data synchronized transactionally
  - avoid cross-tenant access by default
