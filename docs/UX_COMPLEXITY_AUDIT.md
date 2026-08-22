# UX Complexity Audit

## Focus
Backend UX for consumers and operators.

## Observations
- The API is reasonably consistent in its error model, but role mismatches surface as generic forbidden states for end users if controllers drift from the web navigation.
- Time-entry flows are the highest complexity area because they mix auth, tenant scope, schedule policy and time-zone math.
- The most fragile consumer experience is the company-admin path: when role gates are too narrow, the web shell exposes actions that fail at the API boundary.

## UX risks
- Dense error payloads can be hard to translate into user-facing guidance without a shared mapping layer.
- Session lifecycle endpoints need stable reason codes so the web can explain why a button is disabled.
- Cross-tenant 404 masking is good for security, but it can hide legitimate access issues during support triage.

## Current status
- No blocker UX issue remains after the role-access fix.
