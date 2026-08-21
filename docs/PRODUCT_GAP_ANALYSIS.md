# Product Gap Analysis

This document compares the current product against an ideal, modern workforce planning and timekeeping platform for the Spanish market.

## Sources considered

- [Statute of Workers, article 34.9](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430)
- [Royal Decree-Law 8/2019](https://boe.es/buscar/act.php?id=BOE-A-2019-3481)
- [AEPD guide on labor relations and data protection](https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-publica-guia-pd-y-relaciones-laborales)
- [Ministerio de Trabajo FAQs](https://faqstrabajo.mites.gob.es/)

## Gap table

| Area | Current functionality | Ideal functionality | Gap | Priority | Impact | Recommended action | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication | JWT access/refresh, sessions, profile | Multi-role access with super admin and tenant admin separation | `ROLE_SUPER_ADMIN` missing, company admin semantics are still ambiguous | P0 | High | Introduce explicit super admin and company admin semantics | PARTIAL |
| Tenant hierarchy | Company, employee, user | Super admin -> company -> locations -> teams -> employees | Missing work locations and hierarchy depth | P0 | High | Add work locations and location history | PARTIAL |
| Work locations | Not present | Multi-site model with calendar and schedule support | No `WorkLocation` domain | P0 | High | Create location entity, APIs and UI | MISSING |
| Employee mobility | Single company, single calendar | Historical location assignments | No movement history | P1 | High | Add employee-location assignment history | MISSING |
| Scheduling | Shift templates, assignments, overrides, schedule views | Rotations, segments, publishable planning periods, multi-location planning | Planning periods exist, but segments and rotations are still missing | P1 | High | Extend shift model with segments and rotation support | PARTIAL |
| Shift granularity | One start/end per day | Split shifts and planned breaks | Split segments missing | P1 | High | Add shift segments | MISSING |
| Labor rules | Basic calendar thresholds and attendance flows | Configurable policy engine | Policy data exists but runtime evaluation is still partial | P1 | High | Expand work time policy evaluation and alerts | PARTIAL |
| Legal compliance | Daily register and retention already supported conceptually | Configurable compliance rules per company/convenio | Rules are partially hardcoded | P1 | High | Move compliance decisions into policy config | PARTIAL |
| Timekeeping | Start/pause/resume/finish, audits | Plan vs actual, planned location, configurable geolocation | No planned vs actual comparison and no location context | P1 | High | Add planned location and policy-aware comparison | PARTIAL |
| Absences | Vacations, permissions, incidents | Absences integrated into planning and coverage | Existing modules are not yet integrated into staffing calculations deeply enough | P1 | Medium | Feed absences into planning dashboards and conflict checks | PARTIAL |
| Auditing | Time entry audit, session state | Append-only operational audit and planning history | Planning period create/update/publish/unpublish changes are now audited | P1 | Medium | Extend audit coverage to the remaining configuration domains | PARTIAL |
| Reports | Basic summaries | Workforce reports, planned vs actual, compliance reports | Summary reporting endpoint and dashboard views available | P2 | Medium | Expand reports with planned-vs-actual and compliance breakdowns | PARTIAL |
| Super admin UX | None | SaaS platform dashboard and tenant switching | Platform dashboard available with tenant-level summary data | P0 | High | Continue refining the platform area and tenant switching flows | PARTIAL |
| Company admin UX | Existing admin-style areas | Company-scoped operations and configuration | Still centered on legacy roles and modules | P0 | High | Clarify nav and permissions by role | PARTIAL |
| Mobile/Desktop UX | Existing responsive app | Role-specific navigation and scheduling views | No platform/company split in navigation | P0 | High | Update navigation to reflect hierarchy | PARTIAL |
| Tests | Good coverage on existing domains | Coverage for planning, locations, policy engine and tenant boundaries | Planning periods, reporting summary and platform UI are covered with tests | P0 | High | Continue extending service/controller tests and e2e flows | PARTIAL |

## Priority summary

- P0: role hierarchy, work locations, company/platform split, navigation, tenant-aware planning foundations
- P1: location history, split shifts, policy engine, publishable planning, audit history for planning
- P2: reporting and advanced staffing optimizations
