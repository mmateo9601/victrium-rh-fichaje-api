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
| Scheduling | Shift templates, assignments, overrides, schedule views | Rotations, segments, publishable planning periods, multi-location planning | No segments, drafts, publish/publish workflow, or rotations | P1 | High | Extend shift model and add planning periods | PARTIAL |
| Shift granularity | One start/end per day | Split shifts and planned breaks | Split segments missing | P1 | High | Add shift segments | MISSING |
| Labor rules | Basic calendar thresholds and attendance flows | Configurable policy engine | No configurable policy engine | P1 | High | Add work time policy configuration | MISSING |
| Legal compliance | Daily register and retention already supported conceptually | Configurable compliance rules per company/convenio | Rules are partially hardcoded | P1 | High | Move compliance decisions into policy config | PARTIAL |
| Timekeeping | Start/pause/resume/finish, audits | Plan vs actual, planned location, configurable geolocation | No planned vs actual comparison and no location context | P1 | High | Add planned location and policy-aware comparison | PARTIAL |
| Absences | Vacations, permissions, incidents | Absences integrated into planning and coverage | Existing modules are not yet integrated into staffing calculations deeply enough | P1 | Medium | Feed absences into planning dashboards and conflict checks | PARTIAL |
| Auditing | Time entry audit, session state | Append-only operational audit and planning history | Planning changes are not audited consistently | P1 | Medium | Add audit log for planning and configuration changes | MISSING |
| Reports | Basic summaries | Workforce reports, planned vs actual, compliance reports | No dedicated reporting module | P2 | Medium | Add reporting endpoints and views | MISSING |
| Super admin UX | None | SaaS platform dashboard and tenant switching | No platform-level UI | P0 | High | Add platform area in web app | MISSING |
| Company admin UX | Existing admin-style areas | Company-scoped operations and configuration | Still centered on legacy roles and modules | P0 | High | Clarify nav and permissions by role | PARTIAL |
| Mobile/Desktop UX | Existing responsive app | Role-specific navigation and scheduling views | No platform/company split in navigation | P0 | High | Update navigation to reflect hierarchy | PARTIAL |
| Tests | Good coverage on existing domains | Coverage for planning, locations, policy engine and tenant boundaries | Missing tests for new domains | P0 | High | Add service/controller tests and e2e flows | MISSING |

## Priority summary

- P0: role hierarchy, work locations, company/platform split, navigation, tenant-aware planning foundations
- P1: location history, split shifts, policy engine, publishable planning, audit history for planning
- P2: reporting and advanced staffing optimizations

