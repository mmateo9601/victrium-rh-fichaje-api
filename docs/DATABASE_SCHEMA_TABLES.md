# Database Schema Tables

This document defines the canonical enterprise data model for `victrium-rh-fichaje-api`.
It combines the implemented TypeORM tables with a more complete target schema for a
scalable corporate workforce system. Treat the extra fields below as the desired
professional model for future migrations and schema hardening.

## Conventions

- Primary keys are numeric `INT` unless otherwise noted.
- Timestamps use MySQL `datetime` unless the column is a date-only value.
- Date-only fields use `date`.
- Time-only fields use `time`.
- JSON columns store structured payloads and snapshots.
- Foreign keys are shown with their physical column names.
- Some relations are optional in the database but are validated in the service layer for tenant safety.

## Authorized roles

The system only recognizes and authorizes these roles:

- `ROLE_SUPER_ADMIN`
- `ROLE_COMPANY_ADMIN`
- `ROLE_RRHH`
- `ROLE_MANAGER`
- `ROLE_USER`
- `ROLE_AUDITOR`
- `ROLE_WORKFORCE_REPRESENTATIVE`

`ROLE_ADMIN` is not part of the canonical authorization model and should be treated as legacy or unsupported unless a migration explicitly maps it to a current role.

## Enterprise table contract

Every business table in the system should expose, when applicable, a consistent set of fields to support
auditing, soft lifecycle management, and future integrations:

- `id` `int` or `uuid` as the primary key
- `company_id` `int` for tenant-owned tables
- `active` `boolean` for lifecycle control
- `created_at` `datetime`
- `updated_at` `datetime`
- `deleted_at` `datetime` nullable for soft delete or archive flows
- `created_by_id` or `created_by` for audit attribution when relevant
- `updated_by_id` or `updated_by` for audit attribution when relevant
- `version` `int` for optimistic locking when the aggregate changes frequently
- `notes` `text` or `varchar` for operational context
- `metadata` `json` for extensibility where the domain may evolve

CRUD expectation:

- All tables should be manageable through a complete lifecycle.
- The preferred lifecycle is `CREATE -> READ -> UPDATE -> DEACTIVATE/ARCHIVE -> optional DELETE`.
- Where hard deletion would damage history, the API should expose deactivation/archive semantics instead of destructive deletes.
- Read and update operations should remain available even for archived records when the business process requires traceability.

## Enums

- `RoleName`: `ROLE_SUPER_ADMIN`, `ROLE_COMPANY_ADMIN`, `ROLE_RRHH`, `ROLE_MANAGER`, `ROLE_USER`, `ROLE_AUDITOR`, `ROLE_WORKFORCE_REPRESENTATIVE`
- `PermissionStatus`: `PENDIENTE`, `APROBADO`, `DENEGADO`
- `VacationStatus`: `PENDIENTE`, `APROBADO`, `DENEGADO`
- `PlanningPeriodStatus`: `DRAFT`, `PUBLISHED`
- `PlanningPeriodAuditAction`: `CREATE`, `UPDATE`, `PUBLISH`, `UNPUBLISH`
- `Shift state`: `WORKING`, `PAUSED`, `COMPLETED`
- `Time entry type`: `ENTRADA`, `SALIDA`

## Canonical scalability rules

- Tenant-owned tables must always be linked to `companies` unless they are truly platform-wide.
- Cross-company relations must be validated in both the database model and the service layer.
- Time-based rules should always distinguish between minutes and hours in the schema and in the API DTOs.
- Historical data tables should prefer append-only or soft-delete behavior to preserve auditability.
- JSON columns should only be used for genuinely variable structures such as policies, snapshots, rotation patterns, or segments.

## Hierarchical lifecycle policy

The platform follows a strict parent-to-child lifecycle hierarchy:

```text
Company
  -> WorkLocations
  -> Calendars
  -> Employees
  -> Users linked to the company
  -> Shifts / Planning / Assignments
  -> Attendance / Absence / Incident history
```

When a parent entity is deactivated, archived, or deleted, its dependent records must follow the same lifecycle
in a controlled order. This means:

- a company action propagates to its company-owned dependents
- a work-location action propagates to employees, assignments, planning references, and related operational rows
- an employee action propagates to their user link and dependent labor records
- deactivation is preferred when history must remain queryable
- physical deletion is allowed only when the domain explicitly permits it and no protected history is lost

The exact propagation mechanism may be implemented as soft delete, archive, status mirroring, or guarded physical delete,
but the relationship contract must remain hierarchical and deterministic.

---

## 1. `companies`

Tenant root table for the platform.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `name` | varchar(255) | No | Unique |
| `code` | varchar(255) | No | Unique |
| `legal_name` | varchar(255) | Yes | Registered legal name |
| `tax_id` | varchar(64) | Yes | Tax or fiscal identifier |
| `trade_name` | varchar(255) | Yes | Commercial name |
| `address` | text | Yes | Corporate address |
| `city` | varchar(120) | Yes | City |
| `province` | varchar(120) | Yes | Province |
| `postal_code` | varchar(20) | Yes | Postal code |
| `country` | varchar(2) | Yes | ISO country code |
| `phone` | varchar(32) | Yes | Main company phone |
| `contact_email` | varchar(255) | Yes | Administrative contact email |
| `billing_email` | varchar(255) | Yes | Billing contact email |
| `website` | varchar(255) | Yes | Website URL |
| `logo_url` | varchar(255) | Yes | Logo asset URL |
| `locale` | varchar(16) | Yes | Default language/locale |
| `timezone` | varchar(80) | Yes | IANA timezone |
| `fiscal_year_start_month` | tinyint | Yes | 1-12 |
| `notes` | text | Yes | Operational notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `work_policy` | json | Yes | Company policy snapshot |
| `default_calendar_id` | int | Yes | FK to `calendarios.id`, `ON DELETE SET NULL` |
| `active` | boolean | No | Default `true` |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `companies.default_calendar_id -> calendarios.id`
- `companies.id -> employees.company_id`
- `companies.id -> usuarios.company_id`
- `companies.id -> work_locations.company_id`
- `companies.id -> calendarios.company_id`
- `companies.id -> planning_periods.company_id`
- `companies.id -> vacaciones.company_id`
- `companies.id -> permisos.company_id`
- `companies.id -> incidencias.company_id`
- `companies.id -> turnos.company_id`
- `companies.id -> turno_asignaciones.company_id`
- `companies.id -> employment_terms.company_id`
- `companies.id -> employee_location_assignments.company_id`
- `companies.id -> api_keys.company_id`

---

## 2. `calendarios`

Company-scoped calendars.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `nombre` | varchar(255) | No | Unique per company with `year` |
| `code` | varchar(64) | Yes | Stable calendar code |
| `description` | text | Yes | Calendar description |
| `company_id` | int | Yes | FK to `companies.id`, `ON DELETE SET NULL` |
| `active` | boolean | No | Default `false` |
| `year` | int | No | Calendar year |
| `timezone` | varchar(80) | Yes | Calendar timezone |
| `minutos_mas_entrada` | int | No | Minutes allowed before start |
| `minutos_menos_entrada` | int | No | Minutes allowed after start |
| `working_days_per_week` | tinyint | Yes | Expected working days per week |
| `weekly_target_minutes` | int | Yes | Weekly target in minutes |
| `monthly_target_minutes` | int | Yes | Monthly target in minutes |
| `notes` | text | Yes | Operational notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |

Relations:

- `calendarios.company_id -> companies.id`
- `calendarios.id -> dias_laborables.calendario_id`
- `calendarios.id -> employees.calendar_id`
- `calendarios.id -> work_locations.calendar_id`

Indexes / uniqueness:

- Unique `company_id + nombre`
- Unique `company_id + year`

---

## 3. `dias_laborables`

Calendar working-day definitions.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `calendario_id` | int | No | FK to `calendarios.id`, `ON DELETE CASCADE` |
| `dia` | date | No | Working date |
| `hora_inicio` | time | No | Start time |
| `hora_fin` | time | No | End time |

Relations:

- `dias_laborables.calendario_id -> calendarios.id`

Indexes / uniqueness:

- Unique `calendario_id + dia`

---

## 4. `roles`

Role catalog.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `rolNombre` | enum | No | Stored from `RoleName` |
| `description` | varchar(255) | Yes | Human-readable role description |
| `system_role` | boolean | No | Default `true` for built-in roles |
| `active` | boolean | No | Role lifecycle state |

Relations:

- Many-to-many with `usuarios` through `usuario_rol`

---

## 5. `usuarios`

Authentication and identity table.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `email` | varchar(255) | No | Unique |
| `password` | varchar(255) | No | Hashed password |
| `numero` | varchar(255) | No | Unique login identifier |
| `nombre` | varchar(120) | Yes | First name |
| `apellidos` | varchar(180) | Yes | Last names |
| `nombre_empleado` | varchar(255) | No | Display name |
| `dni` | varchar(64) | Yes | Unique personal identifier |
| `telefono` | varchar(32) | Yes | Contact phone |
| `movil` | varchar(32) | Yes | Mobile phone |
| `direccion` | text | Yes | Home address |
| `ciudad` | varchar(120) | Yes | City |
| `provincia` | varchar(120) | Yes | Province |
| `codigo_postal` | varchar(20) | Yes | Postal code |
| `pais` | varchar(2) | Yes | ISO country code |
| `avatar_url` | varchar(255) | Yes | Avatar image URL |
| `locale` | varchar(16) | Yes | User locale |
| `timezone` | varchar(80) | Yes | User timezone |
| `email_verified_at` | datetime | Yes | Email confirmation timestamp |
| `password_changed_at` | datetime | Yes | Password rotation timestamp |
| `must_change_password` | boolean | No | Default `false` |
| `last_login_ip` | varchar(64) | Yes | Last login IP address |
| `company_id` | int | Yes | FK to `companies.id`, `ON DELETE SET NULL` |
| `dias_vacaciones` | int | Yes | Compatibility / counters |
| `horas_generadas` | double | Yes | Compatibility / counters |
| `working` | boolean | Yes | Derived status |
| `en_vacaciones` | boolean | Yes | Derived status |
| `de_baja` | boolean | Yes | Deactivation state |
| `admin` | boolean | Yes | Legacy/platform compatibility flag |
| `ultimo_fichaje` | varchar(255) | Yes | Last punch display value |
| `last_login_at` | datetime | Yes | Not selected by default |
| `preferences` | json | Yes | UI and notification preferences |
| `notes` | text | Yes | Operational notes |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `employee_id` | int | Yes | FK to `employees.id`, `ON DELETE SET NULL` |

Relations:

- `usuarios.company_id -> companies.id`
- `usuarios.employee_id -> employees.id`
- `usuarios.id -> usuario_rol.usuario_id`
- `usuarios.id -> fichajes.usuario_id`
- `usuarios.id -> time_entry_sessions.usuario_id`
- `usuarios.id -> fichaje_audits.corrected_by_id`
- `usuarios.id -> auth_sessions.user_id`
- `usuarios.id -> api_keys.user_id`

Indexes / uniqueness:

- Unique `email`
- Unique `numero`
- Unique `dni`

---

## 6. `usuario_rol`

Join table between users and roles.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `usuario_id` | int | No | FK to `usuarios.id` |
| `rol_id` | int | No | FK to `roles.id` |

Relations:

- `usuario_rol.usuario_id -> usuarios.id`
- `usuario_rol.rol_id -> roles.id`

---

## 7. `employees`

Core employee profile.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `numero` | varchar(255) | No | Employee number |
| `nombre` | varchar(120) | No | First name |
| `apellidos` | varchar(180) | No | Last names |
| `nombre_empleado` | varchar(255) | No | Display name |
| `email` | varchar(255) | No | Unique work email |
| `email_personal` | varchar(255) | Yes | Personal email |
| `dni` | varchar(64) | No | Unique |
| `telefono` | varchar(32) | Yes | Phone |
| `movil` | varchar(32) | Yes | Mobile phone |
| `direccion` | text | Yes | Home address |
| `ciudad` | varchar(120) | Yes | City |
| `provincia` | varchar(120) | Yes | Province |
| `codigo_postal` | varchar(20) | Yes | Postal code |
| `pais` | varchar(2) | Yes | ISO country code |
| `fecha_nacimiento` | date | Yes | Birth date |
| `genero` | varchar(32) | Yes | Gender marker if needed |
| `numero_seguridad_social` | varchar(64) | Yes | Social security number |
| `iban` | varchar(34) | Yes | Payroll account IBAN |
| `titular_iban` | varchar(255) | Yes | IBAN holder |
| `cargo` | varchar(150) | Yes | Job title |
| `departamento` | varchar(150) | Yes | Department name or label |
| `equipo` | varchar(150) | Yes | Team name or label |
| `manager_employee_id` | int | Yes | FK to another employee acting as manager |
| `fecha_alta` | date | Yes | Hire date |
| `fecha_baja` | date | Yes | Termination date |
| `tipo_contrato` | varchar(40) | Yes | Contract type |
| `modalidad` | varchar(40) | Yes | On-site / hybrid / remote |
| `jornada` | varchar(40) | Yes | Full-time / part-time / etc. |
| `puesto` | varchar(150) | Yes | Role in the organization |
| `avatar_url` | varchar(255) | Yes | Avatar image URL |
| `timezone` | varchar(80) | Yes | Preferred timezone |
| `idioma` | varchar(16) | Yes | Preferred language |
| `dias_vacaciones` | int | Yes | Vacation balance |
| `horas_generadas` | double | Yes | Accrued hours |
| `working` | boolean | Yes | Active working state |
| `en_vacaciones` | boolean | Yes | Vacation state |
| `de_baja` | boolean | Yes | Deactivation state |
| `ultimo_fichaje` | varchar(255) | Yes | Last punch display value |
| `work_status` | varchar(32) | Yes | Human-readable operational status |
| `metadata` | json | Yes | Extra extensibility payload |
| `notes` | text | Yes | Operational notes |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `primary_work_location_id` | int | Yes | FK to `work_locations.id`, `ON DELETE SET NULL` |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` / `user` link | int | Yes | 1:1 relation through `usuarios.employee_id` |
| `calendar_id` | int | Yes | FK to `calendarios.id`, `ON DELETE SET NULL` |

Relations:

- `employees.company_id -> companies.id`
- `employees.primary_work_location_id -> work_locations.id`
- `employees.calendar_id -> calendarios.id`
- `employees.id -> usuarios.employee_id` (one-to-one, optional)
- `employees.id -> vacaciones.employee_id`
- `employees.id -> permisos.employee_id`
- `employees.id -> incidencias.employee_id`
- `employees.id -> turno_asignaciones.employee_id`
- `employees.id -> turno_overrides.employee_id`
- `employees.id -> employee_location_assignments.employee_id`
- `employees.id -> employment_terms.employee_id`

Indexes / uniqueness:

- Unique `company + numero`
- Unique `company + dni`
- Additional support indexes on company and primary location

---

## 8. `work_locations`

Company work centers.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `name` | varchar(255) | No | Unique per company |
| `code` | varchar(255) | No | Unique per company |
| `address` | text | Yes | Full address |
| `city` | varchar(120) | Yes | City |
| `province` | varchar(120) | Yes | Province |
| `postal_code` | varchar(20) | Yes | Postal code |
| `timezone` | varchar(80) | Yes | IANA timezone |
| `contact_name` | varchar(255) | Yes | Site contact |
| `contact_phone` | varchar(32) | Yes | Site phone |
| `contact_email` | varchar(255) | Yes | Site email |
| `cost_center_code` | varchar(64) | Yes | Cost allocation code |
| `opening_hours` | json | Yes | Opening hours and operational windows |
| `notes` | text | Yes | Operational notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `active` | boolean | No | Default `true` |
| `latitude` | decimal(10,7) | Yes | Geolocation |
| `longitude` | decimal(10,7) | Yes | Geolocation |
| `calendar_id` | int | Yes | FK to `calendarios.id`, `ON DELETE SET NULL` |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `work_locations.company_id -> companies.id`
- `work_locations.calendar_id -> calendarios.id`
- `work_locations.id -> employee_location_assignments.work_location_id`
- `work_locations.id -> turno_asignaciones.work_location_id`
- `work_locations.id -> turno_overrides.work_location_id`
- `work_locations.id -> employees.primary_work_location_id`

Indexes / uniqueness:

- Unique `company + code`
- Unique `company + name`

---

## 9. `employee_location_assignments`

Employee movement and location planning.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |
| `work_location_id` | int | No | FK to `work_locations.id`, `ON DELETE RESTRICT` |
| `valid_from` | date | No | Start date |
| `valid_to` | date | Yes | End date |
| `primary` | boolean | No | Whether this is the primary assignment |
| `assignment_type` | varchar(40) | Yes | Temporary, permanent, rotation, substitution |
| `priority` | int | Yes | Assignment ordering priority |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `notes` | varchar(255) | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `employee_location_assignments.company_id -> companies.id`
- `employee_location_assignments.employee_id -> employees.id`
- `employee_location_assignments.work_location_id -> work_locations.id`

Indexes:

- Composite index on `company + employee + validFrom + validTo`

---

## 10. `employment_terms`

Contract and labor terms history.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |
| `primary_work_location_id` | int | Yes | FK to `work_locations.id`, `ON DELETE SET NULL` |
| `effective_from` | date | No | Start date |
| `effective_to` | date | Yes | End date |
| `weekly_contract_minutes` | int | No | Weekly contracted minutes |
| `daily_contract_minutes` | int | Yes | Daily target in minutes |
| `monthly_contract_minutes` | int | Yes | Monthly target in minutes |
| `annual_contract_minutes` | int | Yes | Annual contracted minutes |
| `working_percentage` | decimal(5,2) | Yes | Example: `100.00` |
| `contract_type` | varchar(40) | No | Contract type label |
| `employment_group` | varchar(80) | Yes | Internal job group |
| `position_title` | varchar(150) | Yes | Role title |
| `department_name` | varchar(150) | Yes | Department label |
| `team_name` | varchar(150) | Yes | Team label |
| `manager_employee_id` | int | Yes | FK to `employees.id` for line manager |
| `start_shift_minutes_before` | int | Yes | Minutes allowed before shift start |
| `start_shift_minutes_after` | int | Yes | Minutes allowed after shift start |
| `overtime_allowed` | boolean | Yes | Whether extra time is accepted |
| `rest_between_shifts_minutes` | int | Yes | Mandatory rest policy |
| `break_policy_minutes` | int | Yes | Standard break policy |
| `vacation_days_annual` | int | Yes | Annual vacation entitlement |
| `notice_days` | int | Yes | Notice period policy |
| `policy_version` | int | No | Default `1` |
| `policy_snapshot` | json | Yes | Serialized policy state |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |
| `active` | boolean | No | Default `true` |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `employment_terms.company_id -> companies.id`
- `employment_terms.employee_id -> employees.id`
- `employment_terms.primary_work_location_id -> work_locations.id`

Indexes:

- Index on `company + employee + effectiveFrom`
- Index on `employee + effectiveFrom + effectiveTo`

---

## 11. `turnos`

Shift templates.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `name` | varchar(255) | No | Shift name |
| `code` | varchar(255) | No | Unique per company |
| `short_name` | varchar(80) | Yes | Compact label |
| `description` | text | Yes | Description |
| `color` | varchar(24) | Yes | UI color token |
| `active` | boolean | No | Default `true` |
| `timezone` | varchar(80) | Yes | Shift timezone |
| `expected_minutes` | int | Yes | Expected daily minutes |
| `break_minutes_default` | int | Yes | Default break duration |
| `allow_overtime` | boolean | Yes | Whether overtime is allowed |
| `grace_minutes_before` | int | Yes | Allowed early entry window |
| `grace_minutes_after` | int | Yes | Allowed late entry window |
| `rest_between_shifts_minutes` | int | Yes | Minimum rest between shifts |
| `is_night_shift` | boolean | Yes | Night shift flag |
| `workday_type` | varchar(40) | Yes | Normal, intensive, split, flexible |
| `rotation_start_date` | date | Yes | Start date for rotation |
| `rotation_pattern` | json | Yes | Rotation steps |
| `notes` | text | Yes | Operational notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `turnos.company_id -> companies.id`
- `turnos.id -> turno_dias.shift_id`
- `turnos.id -> turno_asignaciones.shift_id`
- `turnos.id -> turno_overrides.shift_id`

Indexes / uniqueness:

- Unique `company + code`
- Unique `company + name`

---

## 12. `turno_dias`

Per-day shift definition.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `shift_id` | int | No | FK to `turnos.id`, `ON DELETE CASCADE` |
| `day_of_week` | tinyint | No | 0-6 or app-defined weekly index |
| `working` | boolean | No | Default `true` |
| `start_time` | time | Yes | Start time |
| `end_time` | time | Yes | End time |
| `break_minutes` | int | No | Default `0` |
| `working_minutes` | int | Yes | Total working minutes |
| `crosses_midnight` | boolean | No | Default `false` |
| `segments` | json | Yes | Optional segmented schedule blocks |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |

Relations:

- `turno_dias.shift_id -> turnos.id`

Indexes:

- Unique `shift_id + day_of_week`

---

## 13. `turno_asignaciones`

Schedule assignment between employee, shift, and work location.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |
| `shift_id` | int | No | FK to `turnos.id`, `ON DELETE RESTRICT` |
| `work_location_id` | int | Yes | FK to `work_locations.id`, `ON DELETE SET NULL` |
| `valid_from` | date | No | Start date |
| `valid_to` | date | Yes | End date |
| `priority` | int | Yes | Assignment priority |
| `source` | varchar(32) | Yes | Manual, import, rule, automation |
| `published` | boolean | No | Default `true` |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `notes` | text | Yes | Free text |
| `active` | boolean | No | Default `true` |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `turno_asignaciones.company_id -> companies.id`
- `turno_asignaciones.employee_id -> employees.id`
- `turno_asignaciones.shift_id -> turnos.id`
- `turno_asignaciones.work_location_id -> work_locations.id`

Indexes:

- Composite index on `company + employee + validFrom + validTo`
- Index on `employee + validFrom`

---

## 14. `turno_overrides`

Manual per-day shift exceptions.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |
| `shift_id` | int | No | FK to `turnos.id`, `ON DELETE RESTRICT` |
| `work_location_id` | int | Yes | FK to `work_locations.id`, `ON DELETE SET NULL` |
| `date` | date | No | Override date |
| `type` | varchar(16) | No | Default `SHIFT` |
| `source` | varchar(32) | Yes | Manual, import, exception |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |

Relations:

- `turno_overrides.company_id -> companies.id`
- `turno_overrides.employee_id -> employees.id`
- `turno_overrides.shift_id -> turnos.id`
- `turno_overrides.work_location_id -> work_locations.id`

---

## 15. `planning_periods`

Planning window.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `name` | varchar(255) | No | Period label |
| `code` | varchar(64) | Yes | Stable period code |
| `description` | text | Yes | Detailed description |
| `start_date` | date | No | Start date |
| `end_date` | date | No | End date |
| `status` | varchar(16) | No | `DRAFT` or `PUBLISHED` |
| `version` | int | No | Default `1` |
| `published_at` | datetime | Yes | Publish timestamp |
| `published_by_id` | int | Yes | FK to `usuarios.id`, `ON DELETE SET NULL` |
| `locked_at` | datetime | Yes | Lock timestamp once frozen |
| `locked_by_id` | int | Yes | FK to `usuarios.id` |
| `scope` | varchar(32) | Yes | Company, work_location, team, employee |
| `created_by` | varchar(100) | Yes | Creator label |
| `updated_by` | varchar(100) | Yes | Last modifier label |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `planning_periods.company_id -> companies.id`
- `planning_periods.published_by_id -> usuarios.id`
- `planning_periods.id -> planning_period_audits.planning_period_id`

---

## 16. `planning_period_audits`

Audit trail for planning period lifecycle changes.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `planning_period_id` | int | No | FK to `planning_periods.id`, `ON DELETE CASCADE` |
| `changed_by_id` | int | Yes | FK to `usuarios.id`, `ON DELETE SET NULL` |
| `action` | varchar(16) | No | Audit action |
| `previous_status` | varchar(16) | Yes | Previous status |
| `next_status` | varchar(16) | No | Next status |
| `previous_version` | int | Yes | Previous version |
| `next_version` | int | No | Next version |
| `previous_snapshot` | json | Yes | Previous serialized state |
| `next_snapshot` | json | No | New serialized state |
| `reason` | text | Yes | Change reason |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Audit timestamp |

Relations:

- `planning_period_audits.planning_period_id -> planning_periods.id`
- `planning_period_audits.changed_by_id -> usuarios.id`

---

## 17. `time_entry_sessions`

Current and historical time tracking sessions.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `usuario_id` | int | No | FK to `usuarios.id`, `ON DELETE CASCADE` |
| `company_id` | int | Yes | FK to `companies.id` for tenant analytics |
| `employee_id` | int | Yes | FK to `employees.id` for identity resolution |
| `work_location_id` | int | Yes | FK to `work_locations.id` |
| `shift_id` | int | Yes | FK to `turnos.id` |
| `started_at` | datetime | No | Session start |
| `finished_at` | datetime | Yes | Session end |
| `state` | varchar(32) | No | `WORKING`, `PAUSED`, `COMPLETED` |
| `source` | varchar(32) | No | Default `web` |
| `device_id` | varchar(128) | Yes | Device fingerprint or hardware id |
| `timezone` | varchar(80) | Yes | Session timezone |
| `started_latitude` | decimal(10,7) | Yes | Start GPS latitude |
| `started_longitude` | decimal(10,7) | Yes | Start GPS longitude |
| `paused_minutes` | int | Yes | Total paused minutes |
| `worked_minutes` | int | Yes | Total worked minutes |
| `expected_minutes` | int | Yes | Expected minutes for the session |
| `overtime_minutes` | int | Yes | Extra minutes beyond expected |
| `notes` | text | Yes | Operational notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `version` | int | No | Optimistic lock |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `time_entry_sessions.usuario_id -> usuarios.id`
- `time_entry_sessions.id -> time_entry_breaks.session_id`

Indexes:

- Index on `usuario + finishedAt`

---

## 18. `time_entry_breaks`

Breaks inside a session.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `session_id` | int | No | FK to `time_entry_sessions.id`, `ON DELETE CASCADE` |
| `started_at` | datetime | No | Break start |
| `ended_at` | datetime | Yes | Break end |
| `reason` | varchar(255) | Yes | Pause reason |
| `notes` | text | Yes | Optional notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

Relations:

- `time_entry_breaks.session_id -> time_entry_sessions.id`

Indexes:

- Index on `session + endedAt`

---

## 19. `fichajes`

Punch records.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `hora` | time | No | Time value |
| `dia` | date | No | Date value |
| `tipo` | varchar(16) | No | `ENTRADA` or `SALIDA` |
| `origen` | varchar(255) | No | Source of the punch |
| `company_id` | int | Yes | FK to `companies.id` for analytics |
| `employee_id` | int | Yes | FK to `employees.id` for reporting |
| `session_id` | int | Yes | FK to `time_entry_sessions.id` |
| `work_location_id` | int | Yes | FK to `work_locations.id` |
| `shift_id` | int | Yes | FK to `turnos.id` |
| `timezone` | varchar(80) | Yes | Punch timezone |
| `latitude` | decimal(10,7) | Yes | Punch latitude |
| `longitude` | decimal(10,7) | Yes | Punch longitude |
| `source_device` | varchar(128) | Yes | Source device identifier |
| `notes` | text | Yes | Operational notes |
| `metadata` | json | Yes | Extra extensibility payload |
| `version` | int | No | Optimistic lock |
| `updated_at` | datetime | No | Update timestamp |
| `usuario_id` | int | No | FK to `usuarios.id` |

Relations:

- `fichajes.usuario_id -> usuarios.id`
- `fichajes.id -> fichaje_audits.time_entry_id`

Indexes:

- Composite index on `usuario + dia + hora`

---

## 20. `fichaje_audits`

Audit trail for time-entry corrections.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `time_entry_id` | int | No | FK to `fichajes.id`, `ON DELETE CASCADE` |
| `corrected_by_id` | int | No | FK to `usuarios.id`, `ON DELETE RESTRICT` |
| `previous_dia` | date | No | Previous date |
| `previous_hora` | time | No | Previous time |
| `previous_tipo` | varchar(16) | No | Previous punch type |
| `new_dia` | date | No | New date |
| `new_hora` | time | No | New time |
| `new_tipo` | varchar(16) | No | New punch type |
| `previous_version` | int | No | Previous version |
| `new_version` | int | No | New version |
| `reason` | text | No | Correction reason |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Audit timestamp |

Relations:

- `fichaje_audits.time_entry_id -> fichajes.id`
- `fichaje_audits.corrected_by_id -> usuarios.id`

---

## 21. `vacaciones`

Vacation requests.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `inicio` | date | No | Start date |
| `fin` | date | No | End date |
| `start_time` | time | Yes | Optional start time for partial-day absences |
| `end_time` | time | Yes | Optional end time for partial-day absences |
| `days_requested` | decimal(5,2) | Yes | Requested days |
| `minutes_requested` | int | Yes | Requested minutes |
| `type` | varchar(40) | Yes | Vacation type |
| `consumidas` | boolean | No | Default `false` |
| `estado` | varchar(32) | No | `PENDIENTE`, `APROBADO`, `DENEGADO` |
| `aprobado` | boolean | No | Default `false` |
| `requested_by_id` | int | Yes | FK to `usuarios.id` |
| `approved_by_id` | int | Yes | FK to `usuarios.id` |
| `rejected_reason` | text | Yes | Rejection reason |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |

Relations:

- `vacaciones.company_id -> companies.id`
- `vacaciones.employee_id -> employees.id`

Indexes:

- Index on `company + estado`
- Index on `employee + inicio`

---

## 22. `permisos`

Permission requests.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `hora_inicio` | time | No | Start time |
| `hora_fin` | time | No | End time |
| `dia` | date | No | Day |
| `descripcion` | text | No | Description |
| `type` | varchar(40) | Yes | Permission type |
| `minutes_requested` | int | Yes | Requested minutes |
| `days_requested` | decimal(5,2) | Yes | Requested days |
| `estado` | varchar(32) | No | `PENDIENTE`, `APROBADO`, `DENEGADO` |
| `aprobado` | boolean | No | Default `false` |
| `requested_by_id` | int | Yes | FK to `usuarios.id` |
| `approved_by_id` | int | Yes | FK to `usuarios.id` |
| `reason` | text | Yes | Business reason |
| `coverage_employee_id` | int | Yes | Employee covering the absence |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |

Relations:

- `permisos.company_id -> companies.id`
- `permisos.employee_id -> employees.id`

Indexes:

- Index on `company + dia`
- Index on `employee + dia`

---

## 23. `incidencias`

Incident tracking.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `descripcion` | text | No | Detailed description |
| `resumen` | varchar(255) | No | Short summary |
| `type` | varchar(40) | Yes | Incident type |
| `severity` | varchar(32) | Yes | Low, medium, high, critical |
| `category` | varchar(80) | Yes | Operational category |
| `source` | varchar(32) | Yes | Web, mobile, desktop, system |
| `dia` | date | No | Incident date |
| `resuelta` | boolean | No | Default `false` |
| `reported_by_id` | int | Yes | FK to `usuarios.id` |
| `resolved_by_id` | int | Yes | FK to `usuarios.id` |
| `resolved_at` | datetime | Yes | Resolution timestamp |
| `explicacion` | text | Yes | Resolution explanation |
| `attachments` | json | Yes | Related evidence or files |
| `notes` | text | Yes | Free text |
| `metadata` | json | Yes | Extra extensibility payload |
| `company_id` | int | No | FK to `companies.id`, `ON DELETE RESTRICT` |
| `employee_id` | int | No | FK to `employees.id`, `ON DELETE CASCADE` |

Relations:

- `incidencias.company_id -> companies.id`
- `incidencias.employee_id -> employees.id`

Indexes:

- Index on `company + dia`
- Index on `employee + dia`

---

## 24. `api_keys`

API credential table.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `key_hash` | varchar(128) | No | Unique |
| `name` | varchar(100) | No | Friendly name |
| `description` | varchar(255) | Yes | Optional description |
| `prefix` | varchar(16) | Yes | Public key prefix for identification |
| `scopes` | json | Yes | Allowed API scopes |
| `user_id` | int | No | FK to `usuarios.id`, `ON DELETE CASCADE` |
| `company_id` | int | Yes | FK to `companies.id`, `ON DELETE SET NULL` |
| `active` | boolean | No | Default `true` |
| `expires_at` | datetime | Yes | Expiration timestamp |
| `last_used_at` | datetime | Yes | Last usage timestamp |
| `last_used_ip` | varchar(64) | Yes | Last usage IP |
| `rotated_at` | datetime | Yes | Rotation timestamp |
| `revoked_at` | datetime | Yes | Revocation timestamp |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |
| `created_by` | varchar(100) | Yes | Creator label |
| `metadata` | json | Yes | Extra extensibility payload |

Relations:

- `api_keys.user_id -> usuarios.id`
- `api_keys.company_id -> companies.id`

---

## 25. `auth_sessions`

Refresh-token backed authentication sessions.

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | char(36) / uuid | No | Primary key |
| `user_id` | int | No | FK to `usuarios.id` |
| `refresh_token_hash` | varchar(255) | No | Hashed refresh token |
| `ip_address` | varchar(64) | Yes | Session IP address |
| `device_fingerprint` | varchar(255) | Yes | Browser or device fingerprint |
| `session_name` | varchar(100) | Yes | Human-readable session label |
| `metadata` | json | Yes | Extra extensibility payload |
| `created_at` | datetime | No | Creation timestamp |
| `expires_at` | datetime | No | Expiration timestamp |
| `revoked_at` | datetime | Yes | Revocation timestamp |
| `user_agent` | varchar(255) | Yes | Client user-agent |
| `device_name` | varchar(255) | Yes | Friendly device name |

Relations:

- `auth_sessions.user_id -> usuarios.id`

---

## 26. Recommended support tables for future scale

The following tables are strongly recommended for a mature corporate workforce platform.
They may not be fully implemented yet, but they complete the model in a realistic enterprise way.

### `departments`

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id` |
| `name` | varchar(150) | No | Department name |
| `code` | varchar(64) | No | Department code |
| `parent_department_id` | int | Yes | FK to `departments.id` |
| `manager_employee_id` | int | Yes | FK to `employees.id` |
| `description` | text | Yes | Description |
| `active` | boolean | No | Default `true` |
| `notes` | text | Yes | Notes |
| `metadata` | json | Yes | Extensibility payload |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

### `teams`

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id` |
| `department_id` | int | Yes | FK to `departments.id` |
| `name` | varchar(150) | No | Team name |
| `code` | varchar(64) | Yes | Team code |
| `manager_employee_id` | int | Yes | FK to `employees.id` |
| `active` | boolean | No | Default `true` |
| `notes` | text | Yes | Notes |
| `metadata` | json | Yes | Extensibility payload |
| `deleted_at` | datetime | Yes | Soft delete / archive timestamp |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

### `company_settings`

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | int | No | Primary key |
| `company_id` | int | No | FK to `companies.id` |
| `setting_key` | varchar(120) | No | Unique within company |
| `setting_value` | json | No | Serialized value |
| `data_type` | varchar(40) | Yes | String, number, boolean, json |
| `active` | boolean | No | Default `true` |
| `notes` | text | Yes | Notes |
| `metadata` | json | Yes | Extensibility payload |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | No | Update timestamp |

### `audit_logs`

| Column | Type | Nullable | Notes |
| --- | --- | --- | --- |
| `id` | uuid | No | Primary key |
| `company_id` | int | Yes | FK to `companies.id` |
| `actor_user_id` | int | Yes | FK to `usuarios.id` |
| `entity_name` | varchar(120) | No | Table or domain entity |
| `entity_id` | varchar(64) | No | Affected record id |
| `action` | varchar(40) | No | CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE |
| `before_data` | json | Yes | Previous state |
| `after_data` | json | Yes | New state |
| `ip_address` | varchar(64) | Yes | Request IP |
| `user_agent` | varchar(255) | Yes | Client agent |
| `reason` | text | Yes | Human explanation |
| `metadata` | json | Yes | Extra context |
| `created_at` | datetime | No | Audit timestamp |

---

## Relationship summary

```text
companies 1 ─── N users
companies 1 ─── N employees
companies 1 ─── N work_locations
companies 1 ─── N calendarios
companies 1 ─── N planning_periods
companies 1 ─── N turnos
companies 1 ─── N vacaciones
companies 1 ─── N permisos
companies 1 ─── N incidencias

calendarios 1 ─── N dias_laborables
calendarios 1 ─── N employees
calendarios 1 ─── N work_locations

users N ─── M roles
users 1 ─── 0..1 employees
users 1 ─── N fichajes
users 1 ─── N time_entry_sessions
users 1 ─── N fichaje_audits (as corrected_by)
users 1 ─── N auth_sessions
users 1 ─── N api_keys

employees 1 ─── N vacaciones
employees 1 ─── N permisos
employees 1 ─── N incidencias
employees 1 ─── N turno_asignaciones
employees 1 ─── N turno_overrides
employees 1 ─── N employee_location_assignments
employees 1 ─── N employment_terms
employees 0..1 ─── 1 usuarios
employees 0..1 ─── 1 work_locations (primary)

turnos 1 ─── N turno_dias
turnos 1 ─── N turno_asignaciones
turnos 1 ─── N turno_overrides

time_entry_sessions 1 ─── N time_entry_breaks
fichajes 1 ─── N fichaje_audits
planning_periods 1 ─── N planning_period_audits
```

## Notes

- Some columns are stored as `json` because the domain needs flexible structures, such as work policies, rotation patterns, shift segments, and planning snapshots.
- Tenant integrity is enforced both by foreign keys and by service-layer validation.
- The schema uses soft lifecycle states (`active`, `de_baja`, `estado`, `status`) instead of destructive deletes for most operational entities.
- Where delete cascades exist, they are intentional for history containment, not for cross-tenant cleanup.
