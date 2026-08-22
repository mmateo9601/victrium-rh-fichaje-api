# QA Defects

## API-001: ROLE_COMPANY_ADMIN was blocked from management routes
- Severity: High
- Status: Fixed
- Impact: company admins could see management screens in the web app but hit 403 on API routes.
- Affected routes: time-entries list/detail/audits/correction; vacations list/detail/approve/deny; permissions list/stats/detail/approve/deny/delete; incidents list/detail/update/resolve/stats.
- Fix: expanded `@ApiRoles` on the affected controllers and added a regression spec for the role metadata.

## API-002: Browser e2e harness unavailable in workspace
- Severity: Low
- Status: Documented
- Impact: no Playwright package was available locally, so browser automation could not be executed from this run.
- Fix: captured as an execution limitation in the QA report.
