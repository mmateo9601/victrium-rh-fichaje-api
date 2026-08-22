# ADR 006: Role Taxonomy Source of Truth

## Status

Accepted

## Context

The backend currently defines a closed `RoleName` enum with five roles:

- `ROLE_SUPER_ADMIN`
- `ROLE_ADMIN`
- `ROLE_COMPANY_ADMIN`
- `ROLE_RRHH`
- `ROLE_USER`

Some documentation already lists additional roles that are not present in the codebase.

## Decision

- The backend enum is the source of truth for role names.
- Frontend navigation and role-based UI filtering must derive from the backend role list.
- Docs must not introduce roles that are not present in the backend enum unless the enum is updated first.
- New roles must be added intentionally in the backend before being exposed in UI or docs.

## Consequences

- Authorization and navigation remain aligned.
- Role drift becomes visible during reviews.
- The UI cannot invent capabilities that the backend does not support.
- Docs remain executable documentation instead of aspirational lists.

