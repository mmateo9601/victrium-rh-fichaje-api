# Scheduling Audit

Fecha de auditoría: 2026-08-22

Alcance:
- `victrium-rh-fichaje-api`
- `victrium-rh-fichaje-web`

Objetivo:
- verificar el estado real del dominio de planificación laboral;
- contrastar el modelo esperado contra la implementación actual;
- señalar qué ya soporta jornada completa, parcial, partida, intensiva, nocturna, flexible, rotativa, multicentro, excepciones, rangos y asignaciones masivas;
- dejar claros los huecos de producto y de arquitectura.

## DOMAIN MODEL

Estado actual del dominio:
- `Shift` existe como agregado principal en `src/database/entities/shift.entity.ts`.
- `ShiftDay` existe como entidad persistida en `src/database/entities/shift-day.entity.ts`.
- `ShiftSegment` no existe como tabla propia; vive embebido en JSON dentro de `ShiftDayEntity.segments`.
- `RotationPattern` no existe como tabla propia; vive embebido en JSON dentro de `ShiftEntity.rotationPattern`.
- `RotationStep` tampoco existe como entidad independiente; vive como valor JSON dentro de `rotationPattern`.
- `ScheduleAssignment` está partido entre `ShiftAssignmentEntity` y `ShiftOverrideEntity`, más la lógica del resolver.
- `ScheduleOverride` existe como entidad propia en `ShiftOverrideEntity`.
- `ScheduleResolver` existe como servicio dedicado en `WorkScheduleResolverService`.
- `EffectiveWorkday` no existe como entidad; se materializa como `ScheduleCellDto` durante la resolución.
- `EffectiveSegment` no existe como entidad; se calcula al resolver el día y se expone como parte del día efectivo.
- `PlanningPeriod` existe como entidad y servicio propios en `planning-periods`.
- `ConflictService` no existe como servicio independiente; los conflictos se validan de forma distribuida.

Conclusión del modelo:
- la base funcional está presente;
- la frontera del dominio aún no está “descompuesta” en los objetos de negocio que pide el modelo objetivo;
- la implementación actual funciona, pero concentra demasiada inteligencia en `ShiftsService` y `WorkScheduleResolverService`.

## ROTATIONS

Lo que soporta hoy:
- `ShiftEntity.rotationStartDate` + `ShiftEntity.rotationPattern` permiten rotaciones cíclicas.
- el resolver prioriza rotación sobre jornada semanal en `resolveRotationDay(...)`.
- el patrón puede alternar días laborables, no laborables y cambios de horario.
- la UI de turno permite editar el patrón como JSON en `src/app/shifts/[id]/page.tsx`.

Límites actuales:
- no hay entidad `RotationPattern` ni `RotationStep`.
- no hay validación semántica rica del patrón más allá de la forma JSON.
- no hay rotaciones por centro, por segmento, ni por reglas condicionales.
- el patrón se resuelve por posición en ciclo, no por reglas de negocio explícitas.

Lectura funcional:
- sí cubre rotativa básica y algunos escenarios de turnos alternos;
- no cubre todavía rotaciones complejas con pasos tipados, dependencias o excepciones por tramo.

## SEGMENTS

Lo que soporta hoy:
- `ShiftDayEntity.segments` guarda varios tramos por día.
- el resolver suma segmentos para calcular minutos esperados y detecta si cruza medianoche.
- el frontend de edición de turno muestra segmentos por día y los renderiza en la vista de detalle.

Límites actuales:
- los segmentos no tienen identidad propia ni persistencia separada.
- no hay validación fuerte por tramo sobre solapes, huecos, descansos mínimos o secuencia incorrecta.
- la API expone el concepto, pero la semántica sigue siendo “JSON embebido” en lugar de entidad de dominio.

Lectura funcional:
- sí soporta jornada partida y algunos esquemas multi-tramo;
- todavía falta convertir el tramo en una unidad de dominio más explícita.

## LOCATIONS

Lo que soporta hoy:
- `WorkLocationEntity` es la base multicentro.
- `ShiftAssignmentEntity.workLocation` permite asignar un centro junto al turno.
- `ShiftOverrideEntity.workLocation` permite excepciones con centro puntual.
- `EmployeeLocationAssignmentEntity` permite centro primario o histórico por empleado.
- `EmploymentTermsEntity.primaryWorkLocation` añade una fuente adicional para el centro efectivo.
- el resolver aplica prioridad de centro: override > assignment > employee_location > terms > default.

Frontend actual:
- la pantalla de planificación permite asignación rápida de empleado + turno + fechas + centro.
- el calendario visual enseña el centro resuelto en el detalle del evento.

Lectura funcional:
- multicentro está bien encaminado;
- el sistema ya no depende de un único centro fijo ni de `employee.shiftId`.

## CONFLICTS

Conflictos que sí se controlan:
- solape de asignaciones para el mismo empleado en `ShiftsService.assertAssignmentOverlap(...)`.
- duplicidad de excepción por empleado y fecha en `ShiftOverrideEntity`.
- cambio de turno o centro cross-tenant fuera de la empresa.
- evaluación de política laboral por jornada: descanso, exceso diario, retraso, nocturnidad y horas extra.

Conflictos que faltan como frontera propia:
- no existe un `ConflictService` independiente.
- no hay motor de conflictos para cobertura insuficiente, huecos de plantilla, incompatibilidad de centro, ni reglas de rotación avanzadas.
- la validación está repartida entre persistencia, resolver y policy evaluation.

Lectura funcional:
- hay prevención de errores operativos básicos;
- todavía no hay un subsistema de conflictos como el del modelo objetivo.

## EMPLOYEE VIEW

Lo que ve hoy el empleado:
- calendario personal en `src/app/my-calendar/page.tsx`.
- vista de agenda, mes, semana y día con FullCalendar estándar.
- detalle de cuándo trabaja, dónde trabaja, qué turno tiene y qué diferencia hay entre planificado y real.
- grid tabular de planificación en `ScheduleGrid`.

Endpoints que lo soportan:
- `GET /api/v1/schedule/me`
- `GET /api/v1/employees/:id/schedule`
- `GET /api/v1/shifts/me`

Lectura funcional:
- la experiencia del empleado ya cubre “cuándo trabajo”, “dónde” y “con qué turno”;
- el calendario individual está bien resuelto con `@fullcalendar/react`, `dayGrid`, `timeGrid`, `list` y `multiMonth`;
- no se usa `schedulerLicenseKey`, así que cumple la restricción de FullCalendar Standard.

## RRHH VIEW

Lo que ve hoy RRHH:
- pantalla propia de planificación en `src/app/schedule/page.tsx`.
- filtros por rango, empleado, turno y periodo de planificación.
- asignación rápida de turno.
- asignación rápida de centro.
- excepción puntual por fecha.
- calendario visual de cuadrante propio.
- grid tabular para lectura masiva.

Lectura funcional:
- el flujo RRHH “Empleado + Turno + Fecha/rango + Centro” ya es rápido y directo.
- la vista mezcla lectura operativa y edición rápida, que encaja con el objetivo de cuadrante propio.
- no depende del calendario genérico de RRHH para editar; lo usa como vista de lectura y validación visual.

## TESTS

Backend:
- `src/modules/shifts/work-schedule-resolver.service.spec.ts`
  - policy sin configuración;
  - warnings y violaciones por descanso y jornada;
  - nocturnidad y horas extra;
  - rotación frente a jornada semanal;
  - prioridad de centro y términos efectivos.
- `src/modules/planning-periods/planning-periods.service.spec.ts`
  - creación de periodo en borrador;
  - publicación con auditoría.

Frontend:
- existen pruebas de apoyo para utilidades y navegación;
- el área de planificación depende sobre todo de pruebas de componente y utilidades, no de un set extenso de tests de calendario.

Cobertura observada:
- buena protección del resolver y de planning periods;
- cobertura más débil en conflictos, asignaciones masivas y comportamiento visual del calendario.

## PENDING

- extraer `ConflictService` como frontera explícita de dominio.
- separar `ShiftSegment` y `RotationPattern` en modelos propios si se quiere evolucionar el dominio sin seguir cargando JSON.
- reforzar validación de segmentos: solapes, huecos, descanso mínimo, cruces de medianoche y coherencia de minutos.
- ampliar validaciones de rotación para pasos heterogéneos, calendarios de ciclo y excepciones.
- cubrir asignaciones masivas con endpoints y tests específicos.
- añadir tests de conflicto y de schedule resolver para escenarios multicentro más complejos.
- reducir la carga de `WorkScheduleResolverService` si se siguen añadiendo reglas de negocio.

