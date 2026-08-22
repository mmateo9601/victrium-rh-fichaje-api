# Integration Architecture

Date: 2026-08-22

## Purpose

Define the integration architecture for the current monolith so the core domain stays independent from external channels while the product becomes ready for:

- Mobile
- Desktop
- Kiosk
- Payroll
- BI
- Access Control
- Webhooks
- SSO

This document is intentionally preparatory. It does not introduce external integrations yet. It sets the rules that future adapters must follow.

## Core Principles

1. Core domain first.
   - Attendance, planning, users, employees, companies and policy rules remain inside the application core.
   - Integrations must not own business truth.

2. Integration adapters at the edge.
   - Mobile, desktop, kiosk, payroll, BI, access control, webhooks and SSO are edge concerns.
   - They translate external requests into domain commands and domain events into external payloads.

3. One canonical backend.
   - The API remains the source of truth.
   - The web app is a consumer of backend contracts, not a parallel domain engine.

4. No premature platform split.
   - No microservices.
   - No Kafka.
   - No Redis unless a concrete requirement appears.
   - Start with database-backed consistency and explicit contracts.

5. Versioned contracts only.
   - Any public integration surface must be versioned.
   - Breaking changes require explicit versioning or deprecation.

## Current State

The repository already has useful integration primitives:

- API versioning over URI paths.
- Swagger documentation for Bearer JWT and `x-api-key`.
- API key entities with hashed storage, activation, expiration and last-used tracking.
- Time entry versioning and audit records.
- Request-level correlation via request id middleware.
- Modular NestJS boundaries in the backend.

The missing pieces are not infrastructure scale problems. They are contract discipline problems:

- no explicit domain event model;
- no outbox table or delivery loop;
- no declared idempotency strategy for write endpoints;
- no explicit separation between client timestamp and server receipt timestamp;
- no scopes model for integration credentials beyond role and tenant access;
- no webhook delivery model yet.

## API Stability

The API should be treated as a stable integration surface, even while internal modules evolve.

Rules:

- Keep `/api/v1` as the default public surface.
- Preserve request and response schemas for external consumers.
- Add new fields in a backward-compatible way.
- Never silently change meaning of existing timestamps, statuses or enums.
- Document any behavior that differs between authenticated user traffic and machine-to-machine traffic.

Recommended practice:

- public integration endpoints should be explicit in Swagger;
- internal-only helpers should stay out of the public contract;
- generated clients should be refreshed from the canonical OpenAPI document.

## Idempotency

External clients will retry. The API must assume duplicate delivery.

Minimum rule set:

- write endpoints that create or transition state should accept an idempotency key when the action can be retried safely;
- the server should store the key together with tenant, actor, endpoint and request fingerprint;
- duplicate requests with the same key should return the original result;
- idempotency scope must be per integration credential and per logical operation, not global.

Practical guidance:

- use idempotency for clock-in, clock-out, corrections, webhook acknowledgements and any future import job;
- do not use idempotency as a substitute for validation;
- do not depend on client-side retries alone.

Recommended implementation later:

- a small relational table in the same database;
- unique constraint on `{integration_credential_id, idempotency_key, operation}`;
- retention policy for old keys.

## Time Event Sources

Time data needs a clear origin model because the same event can arrive from different devices and at different times.

Every time event should carry:

- `clientOccurredAt`: when the device or client says the action happened;
- `serverReceivedAt`: when the API received the request;
- `source`: which channel produced the event, for example `web`, `mobile`, `desktop`, `kiosk`, `api-key`, `system`;
- `actor`: authenticated user or system identity;
- `deviceContext`: optional device or terminal metadata.

Why this matters:

- kiosk and mobile can be offline or delayed;
- desktop integrations can batch events;
- payroll and BI consumers need to know which timestamp is operational truth and which is transport truth.

Rule of thumb:

- `clientOccurredAt` is the external observation;
- `serverReceivedAt` is the audit and ingestion truth;
- domain calculations should always know which one they are using.

Current fit with the codebase:

- `TimeEntrySessionEntity.source` already exists.
- `TimeEntryEntity.version` and `TimeEntryAuditEntity` already support controlled updates.
- the missing part is adding explicit timestamp semantics to future DTOs and event payloads.

## Domain Events

The core domain should publish events internally when significant state changes happen.

Examples:

- `time-entry.clocked-in`
- `time-entry.clocked-out`
- `time-entry.corrected`
- `shift.assigned`
- `shift.overridden`
- `planning-period.published`
- `vacation.approved`
- `permission.approved`

Important:

- domain events are not integration events by default;
- events should describe what happened in the business language, not how an external system should react;
- handlers may persist projections, emit webhooks, update audit views or schedule follow-up work.

Suggested shape:

- event id
- event type
- aggregate type
- aggregate id
- tenant/company id
- actor id
- occurred at
- payload
- version

## Outbox Readiness

There is currently no outbox implementation.

That is acceptable for now, but the architecture should be ready for one when external delivery becomes necessary.

Outbox readiness means:

- the domain write and the event record should be committed together;
- event dispatch should be asynchronous relative to the user request;
- failed deliveries should be retryable without duplicating business state;
- event publication should not depend on an external broker.

Recommended future implementation:

- relational outbox table in the same database;
- a lightweight polling worker inside the monolith or deployment job;
- no Kafka requirement;
- no Redis requirement;
- deliveries marked with state, attempts, next retry and last error.

This keeps the system simple and fits the current deployment model.

## Webhook Model

Webhooks are outgoing integration events for third parties.

They should be modeled as a separate capability from inbound APIs.

Minimum webhook model:

- subscription target URL;
- subscribed event types;
- shared signing secret or signature key;
- enabled/disabled state;
- retry policy;
- delivery attempts and response history;
- per-tenant ownership.

Delivery rules:

- sign every payload;
- include event id and timestamp;
- deliver at least once;
- expect duplicates at the receiver;
- support replay from stored deliveries.

Payload rules:

- send a stable envelope with metadata and event body;
- never expose raw internal entities;
- redact sensitive fields by default;
- version webhook payloads independently from REST endpoints when needed.

## Integration Credentials

Different integrations should not share the same credential semantics.

Current state:

- API keys exist and are hashed at rest.
- API keys resolve to a user principal with tenant access.

Needed evolution:

- distinguish user-facing login credentials from machine credentials;
- allow future credentials for service accounts, kiosk terminals and third-party consumers;
- attach metadata such as name, description, company, expiration, last used time and status;
- record the source and purpose of each credential.

Recommended credential types:

- user session token for browser/mobile human flows;
- API key for server-to-server and kiosk style flows;
- future service credential for payroll, BI or access control;
- future SSO assertion for enterprise identity providers.

## Scopes

Scopes are missing as a first-class concept and should be introduced before broad externalization.

Roles answer "who is this user inside the app".
Scopes answer "what can this credential do through this integration".

Recommended scope families:

- identity read
- identity write
- time entry read
- time entry write
- schedule read
- schedule write
- payroll export
- BI export
- webhook manage
- kiosk register
- access-control sync

Rules:

- scopes should be additive and explicit;
- a credential should get the minimum scope set required;
- scopes should be checked before role-based business logic when the caller is a machine identity;
- company and tenant boundaries still apply.

## Channel Architecture

### Mobile

- Human-first client.
- Uses JWT for interactive sessions.
- Can use API keys only for device enrollment or controlled kiosk-like scenarios.
- Must handle offline retries with idempotency keys.
- Must preserve `clientOccurredAt` if it records events offline.

### Desktop

- Best for rich internal operations or installation-based workflows.
- Can share the same public API contracts as mobile.
- Should not introduce custom business rules outside the backend.
- If local caching is needed later, it must remain a cache, not a parallel source of truth.

### Kiosk

- Treat as a constrained device identity.
- Prefer short-lived, scoped credentials.
- Require strict event source tagging.
- Support clock-in and clock-out flows with retry-safe submissions.

### Payroll

- Usually outbound export plus occasional inbound corrections or acknowledgements.
- Needs stable snapshots, not live mutable views.
- Must consume versioned data with clear effective dates.
- Should prefer batch exports over direct table access.

### BI

- Read-only analytical access.
- Should consume curated projections or export views.
- Must not query operational tables directly if a reporting view can serve the need.
- Needs data freshness labels and timestamp semantics.

### Access Control

- Usually device and user synchronization.
- Needs deterministic identities and location mappings.
- Should not write into attendance history directly.
- Should integrate through commands and acknowledgements, not direct domain mutation.

### Webhooks

- Outbound only unless a specific callback protocol is introduced later.
- Built on internal domain events and outbox delivery.
- Needs retry, signing and replay.

### SSO

- Should remain isolated as an authentication boundary.
- Identity proofing belongs at the edge, not in the domain.
- User provisioning and attribute mapping should be explicit.
- Group-to-role mapping should be controlled and auditable.

## API and Web Responsibilities

### API

- Own authentication, authorization, tenant scoping and domain writes.
- Expose versioned integration contracts.
- Persist audits, timestamps and event records.
- Generate OpenAPI as the canonical contract source.

### Web

- Consume the API as a client.
- Remain presentation and workflow oriented.
- Avoid reimplementing domain rules that affect scheduling, timekeeping or compliance.
- Keep local analytics as display helpers only.

## Recommended Event Fields

Every outward-facing integration payload should be able to carry:

- `eventId`
- `eventType`
- `schemaVersion`
- `tenantId`
- `aggregateType`
- `aggregateId`
- `actorId`
- `clientOccurredAt`
- `serverReceivedAt`
- `source`
- `idempotencyKey`
- `payload`

## Non-Goals

- No microservices split.
- No Kafka cluster.
- No Redis dependency for integration delivery.
- No hidden side-channel business logic in frontend apps.
- No direct third-party writes into core tables.

## Roadmap

1. Formalize integration DTOs for time events and external commands.
2. Add idempotency storage for retryable writes.
3. Introduce a domain event contract inside the monolith.
4. Add an outbox table and internal dispatcher when the first outbound delivery use case is real.
5. Define credential scopes for machine consumers.
6. Add webhook subscriptions and delivery logs after the event model is stable.

## MOBILE READINESS

Mobile is partially ready.

- The API already supports versioned authentication and can serve a mobile client through the same backend contracts as the web app.
- Time entry logic already has versioning and audit support, which is useful for retryable mobile submissions.
- What is still missing is a mobile-specific integration contract for offline retries, `clientOccurredAt`, explicit source tagging and idempotent command handling.
- Recommendation: treat mobile as a first-class client of the API, but introduce a dedicated mobile command envelope before enabling offline or background sync flows.

## DESKTOP READINESS

Desktop is partially ready.

- The monolith can already support desktop workflows through authenticated API access.
- API keys are a good fit for controlled desktop or installed-client scenarios, but they still need scope refinement before broad rollout.
- What is still missing is a formal machine-credential policy for desktop installs, retry-safe write semantics and device metadata for audit.
- Recommendation: keep desktop on the same REST contracts as web and mobile, and avoid adding local business logic that diverges from the backend.

## KIOSK READINESS

Kiosk is early-stage ready only.

- The current API can authenticate requests, but kiosk behavior needs stronger device identity and stricter scope control.
- Kiosk submissions should be treated as high-retry, high-audit flows with clear source tagging and idempotency.
- What is still missing is a kiosk credential type, terminal enrollment flow, and a dedicated event source model.
- Recommendation: do not hardcode kiosk rules into time-entry domain logic; add a kiosk adapter layer first.

## PAYROLL

Payroll is not ready as a product integration, but the core data model is close.

- The system already keeps time entries, audits and planning data that can feed payroll exports.
- Payroll must consume stable snapshots with effective dates, not raw mutable operational records.
- What is missing is a payroll export contract, field mapping, versioned payloads and a reconciliation model for corrections.
- Recommendation: start with read-only exports and signed file or API delivery, then add acknowledgements only if a downstream system really needs them.

## WEBHOOKS

Webhooks are not implemented yet.

- The right foundation is domain events plus an outbox, not direct synchronous callbacks from domain services.
- Webhooks should be outbound only by default, signed, retriable and replayable.
- What is missing is the subscription model, delivery log, retry policy and payload versioning.
- Recommendation: delay webhook delivery until the event contract is stable enough to expose externally.

## DOMAIN EVENTS

Domain events are the right abstraction for future integrations.

- They should be emitted from the domain boundary after successful state changes.
- They should describe business facts, not transport concerns.
- They can later feed webhooks, BI projections, payroll exports and access-control sync jobs.
- Current code has audit tables and version columns, but not a formal event layer yet.
- Recommendation: introduce event names and payload contracts before choosing any delivery mechanism.

## RISKS

1. Event drift risk.
   - If integrations are added before event names and timestamps are standardized, each channel will invent its own meaning for the same business action.

2. Duplicate write risk.
   - Retryable clients without idempotency will create double clocks, double approvals or repeated exports.

3. Credential sprawl risk.
   - If API keys are reused for every channel without scopes, machine access will become too broad.

4. Time semantics risk.
   - If `clientOccurredAt` and `serverReceivedAt` are not explicit, audits and payroll exports can disagree.

5. Integration leakage risk.
   - If web or future clients reimplement business logic, the core domain will fragment and become harder to govern.

6. Delivery reliability risk.
   - Without an outbox, webhook or export failures will be hard to retry safely.

7. Overengineering risk.
   - Building Kafka, microservices or extra infra before the use cases justify them would add cost without solving the current gaps.
