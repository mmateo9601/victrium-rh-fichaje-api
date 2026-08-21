# Spanish Work Time Compliance

This document describes the compliance-oriented rules the product is designed to support.

It is not legal advice.

## Official references

- [Statute of Workers, article 34](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430)
- [Royal Decree-Law 8/2019](https://boe.es/buscar/act.php?id=BOE-A-2019-3481)
- [AEPD guide on labor relations and data protection](https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-publica-guia-pd-y-relaciones-laborales)
- [Ministerio de Trabajo FAQs](https://faqstrabajo.mites.gob.es/)

## General principles supported by the system

- Daily time registration with concrete start and finish timestamps.
- Four-year retention for time records and monthly summaries where applicable.
- Visibility for employees, representatives and inspection roles, depending on permissions.
- Configurable labor rules instead of hard-coded one-size-fits-all assumptions.
- Audit trail for changes to timekeeping and planning data.

## Configurable rules

The platform should let each company configure:

- weekly target hours;
- annual target hours;
- maximum daily duration;
- rest between working days;
- weekly rest;
- mandatory break policy;
- tolerance windows;
- flexible schedule windows;
- overtime handling;
- night work policy;
- irregular distribution of working time;
- collective agreement references;
- special regimes for specific activities.

## What must not be treated as universal

- That all companies have the same schedule rules.
- That all employees share the same calendar.
- That the planned location equals the real clock-in location.
- That geolocation is mandatory.

## Privacy and geolocation

If geolocation is used, it must be:

- optional;
- purpose-limited;
- transparently communicated;
- compatible with data minimization;
- disabled by default unless a company policy explicitly enables it.

The AEPD guidance is relevant because the system should use the least invasive control method that fits the operational purpose.

## Retention

The product should preserve timekeeping records and planning history for the legally required retention period and avoid destructive automated deletion for those records.

