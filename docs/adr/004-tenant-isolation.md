# ADR 004: Tenant Isolation by Authenticated Context

## Status

Accepted

## Context

The original system did not expose an explicit company tenant model, but the new migration needs multi-company isolation to prevent accidental or intentional cross-tenant access.

The backend already uses JWT authentication, role-based guards and a MySQL monolith. Repeating `companyId` filters in every query would be easy to miss and hard to audit.

## Decision

- Derive tenant context from the authenticated principal.
- Persist the current company on the user token payload when available.
- Centralize tenant helpers in `TenantScopeService`.
- Use `ROLE_ADMIN` as the only global bypass in the current model.
- For tenant-scoped users, default to company-scoped queries and resource checks.
- Return `404` for cross-tenant resource access to avoid confirming the existence of foreign records.
- Never trust `companyId` from the frontend as a source of authority.

## Consequences

- Services can apply scope consistently without copy-pasting raw `where company_id = ...` blocks everywhere.
- Controllers remain simple and focused on authorization metadata.
- Employee and company reads become harder to forget to secure.
- The tenant rule is explicit and testable through unit tests.

## Notes

- The model can evolve to more advanced global-role handling later.
- If a future domain needs a wider scope, it should be added through the tenant helper instead of ad hoc query conditions.
