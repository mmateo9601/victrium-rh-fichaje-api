import { Injectable } from '@nestjs/common';

import { CalendarDayEntity } from '../../database/entities/calendar-day.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { ShiftAssignmentEntity } from '../../database/entities/shift-assignment.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { ShiftOverrideEntity } from '../../database/entities/shift-override.entity';
import {
  ScheduleCellDto,
  ScheduleRowDto,
  ShiftSummaryDto,
  WorkPolicyEvaluationDto
} from './dto/shift.dto';

type ResolverInput = {
  employee: EmployeeEntity;
  date: string;
  assignments: ShiftAssignmentEntity[];
  overrides: ShiftOverrideEntity[];
  calendarDay?: CalendarDayEntity | null;
  vacations: VacationEntity[];
  permissions: PermissionEntity[];
  incidents: IncidentEntity[];
  timeEntries: TimeEntryEntity[];
};

function dayLabel(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace('.', '');
}

function dayOfWeek(date: string) {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

function timeToMinutes(time: string | null | undefined) {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function diffMinutes(start: string | null | undefined, end: string | null | undefined, crossesMidnight: boolean) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return 0;
  return Math.max(0, crossesMidnight || endMinutes <= startMinutes ? endMinutes + 24 * 60 - startMinutes : endMinutes - startMinutes);
}

function buildShiftSummary(shift: ShiftEntity | null | undefined): ShiftSummaryDto | null {
  if (!shift) return null;
  return {
    id: shift.id,
    name: shift.name,
    code: shift.code,
    color: shift.color ?? null
  };
}

function addDays(date: string, offset: number) {
  const cursor = new Date(`${date}T12:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() + offset);
  return cursor.toISOString().slice(0, 10);
}

function sameDate(a: string, b: string) {
  return a === b;
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function hasPolicyConfig(policy: Record<string, unknown> | null | undefined) {
  if (!policy) {
    return false;
  }

  return ['maxDailyMinutes', 'minimumBreakMinutes', 'lateThresholdMinutes'].some((key) => toNumber(policy[key]) !== null);
}

function calculateBreakMinutes(timeEntries: TimeEntryEntity[]) {
  let total = 0;
  let openEntry: TimeEntryEntity | null = null;
  let previousExit: TimeEntryEntity | null = null;

  for (const entry of timeEntries) {
    if (entry.tipo === 'ENTRADA') {
      if (previousExit) {
        total += Math.max(0, (timeToMinutes(entry.hora) ?? 0) - (timeToMinutes(previousExit.hora) ?? 0));
        previousExit = null;
      }
      openEntry = entry;
      continue;
    }

    if (entry.tipo === 'SALIDA' && openEntry) {
      openEntry = null;
      previousExit = entry;
    }
  }

  return total;
}

function buildPolicyEvaluation(
  workPolicy: Record<string, unknown> | null | undefined,
  shiftDay: { breakMinutes: number; workingMinutes?: number | null } | null,
  dayEntries: TimeEntryEntity[],
  workedMinutes: number,
  lateMinutes: number
): WorkPolicyEvaluationDto | null {
  if (!hasPolicyConfig(workPolicy)) {
    return null;
  }

  const maxDailyMinutes = toNumber(workPolicy?.maxDailyMinutes) ?? shiftDay?.workingMinutes ?? null;
  const minimumBreakMinutes = toNumber(workPolicy?.minimumBreakMinutes) ?? shiftDay?.breakMinutes ?? null;
  const lateThresholdMinutes = toNumber(workPolicy?.lateThresholdMinutes);
  const actualBreakMinutes = calculateBreakMinutes(dayEntries);
  const warnings: string[] = [];
  const violations: string[] = [];

  if (minimumBreakMinutes !== null && actualBreakMinutes < minimumBreakMinutes) {
    violations.push(`Descanso insuficiente: ${actualBreakMinutes} min frente a ${minimumBreakMinutes} min configurados`);
  }

  if (maxDailyMinutes !== null && workedMinutes > maxDailyMinutes) {
    violations.push(`Jornada diaria superada: ${workedMinutes} min frente a ${maxDailyMinutes} min permitidos`);
  }

  if (lateThresholdMinutes !== null && lateMinutes > lateThresholdMinutes) {
    warnings.push(`Retraso superior al umbral configurado: ${lateMinutes} min frente a ${lateThresholdMinutes} min`);
  }

  if (shiftDay?.workingMinutes !== null && shiftDay?.workingMinutes !== undefined && workedMinutes < shiftDay.workingMinutes) {
    warnings.push(`Horas trabajadas por debajo de lo previsto: ${workedMinutes} min frente a ${shiftDay.workingMinutes} min`);
  }

  return {
    configured: true,
    maxDailyMinutes,
    minimumBreakMinutes,
    lateThresholdMinutes,
    expectedBreakMinutes: shiftDay?.breakMinutes ?? null,
    actualBreakMinutes,
    warnings,
    violations
  };
}

@Injectable()
export class WorkScheduleResolverService {
  resolveShiftForDate(date: string, assignments: ShiftAssignmentEntity[], overrides: ShiftOverrideEntity[]) {
    const override = [...overrides]
      .filter((item) => sameDate(item.date, date))
      .sort((left, right) => right.id - left.id)[0] ?? null;

    if (override) {
      return {
        shift: override.kind === 'OFF' ? null : override.shift ?? null,
        assignment: null,
        override
      };
    }

    const assignment = [...assignments]
      .filter((item) => item.active)
      .filter((item) => item.validFrom <= date && (item.validTo === null || item.validTo === undefined || item.validTo >= date))
      .sort((left, right) => right.validFrom.localeCompare(left.validFrom) || right.id - left.id)[0] ?? null;

    return {
      shift: assignment?.shift ?? null,
      assignment,
      override: null
    };
  }

  resolveDay(input: ResolverInput): ScheduleCellDto {
    const { employee, date, assignments, overrides, calendarDay, vacations, permissions, incidents, timeEntries } = input;
    const resolved = this.resolveShiftForDate(date, assignments, overrides);
    const shift = resolved.shift;
    const shiftDay = shift?.days?.find((day) => day.dayOfWeek === dayOfWeek(date)) ?? null;
    const vacation = vacations.find((item) => item.inicio <= date && item.fin >= date) ?? null;
    const permission = permissions.find((item) => item.dia === date) ?? null;
    const incident = incidents.find((item) => item.dia === date) ?? null;
    const dayEntries = [...timeEntries].filter((entry) => entry.dia === date).sort((left, right) => left.hora.localeCompare(right.hora) || left.id - right.id);
    const firstEntry = dayEntries.find((entry) => entry.tipo === 'ENTRADA') ?? null;
    const lastExit = [...dayEntries].reverse().find((entry) => entry.tipo === 'SALIDA') ?? null;
    const workedMinutes = this.calculateWorkedMinutes(dayEntries);
    const isHoliday = Boolean(calendarDay && calendarDay.horaInicio === '00:00:00' && calendarDay.horaFin === '00:00:00');
    const workingDay = vacation ? false : permission ? false : isHoliday ? false : Boolean(shiftDay?.working ?? false);
    const expectedMinutes = workingDay && shiftDay ? shiftDay.workingMinutes ?? diffMinutes(shiftDay.startTime, shiftDay.endTime, shiftDay.crossesMidnight) : 0;
    const lateMinutes =
      workingDay && shiftDay && firstEntry
        ? Math.max(0, (timeToMinutes(firstEntry.hora) ?? 0) - (timeToMinutes(shiftDay.startTime) ?? 0))
        : 0;

    let status: ScheduleCellDto['status'] = 'NO_SHIFT';
    let statusLabel = 'Sin turno';
    if (vacation) {
      status = 'VACATION';
      statusLabel = 'Vacaciones';
    } else if (permission) {
      status = 'PERMISSION';
      statusLabel = 'Permiso';
    } else if (isHoliday) {
      status = 'HOLIDAY';
      statusLabel = 'Festivo';
    } else if (resolved.override?.kind === 'OFF' || (!shift && !shiftDay)) {
      status = 'OFF';
      statusLabel = 'Libre';
    } else if (shift) {
      status = 'WORKING';
      statusLabel = shift.name;
    }

    const policy = buildPolicyEvaluation(employee.company?.workPolicy ?? null, shiftDay, dayEntries, workedMinutes, lateMinutes);

    return {
      date,
      dayOfWeek: dayOfWeek(date),
      label: dayLabel(date),
      workingDay,
      isHoliday,
      status,
      statusLabel,
      shift: buildShiftSummary(shift),
      assignmentId: resolved.assignment?.id ?? null,
      overrideId: resolved.override?.id ?? null,
      overrideKind: resolved.override?.kind ?? null,
      expectedStart: workingDay ? shiftDay?.startTime ?? null : null,
      expectedEnd: workingDay ? shiftDay?.endTime ?? null : null,
      expectedMinutes,
      breakMinutes: workingDay && shiftDay ? shiftDay.breakMinutes : 0,
      workedMinutes,
      differenceMinutes: workedMinutes - expectedMinutes,
      lateMinutes,
      vacationId: vacation?.id ?? null,
      permissionId: permission?.id ?? null,
      incidentId: incident?.id ?? null,
      firstEntry: firstEntry?.hora ?? null,
      lastExit: lastExit?.hora ?? null,
      policy
    };
  }

  buildRange(from: string, to: string) {
    const days: Array<{ date: string; dayOfWeek: number; label: string }> = [];
    for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
      days.push({
        date: cursor,
        dayOfWeek: dayOfWeek(cursor),
        label: dayLabel(cursor)
      });
    }
    return days;
  }

  buildEmployeeRows(
    employees: EmployeeEntity[],
    days: Array<{ date: string; dayOfWeek: number; label: string }>,
    assignmentsByEmployee: Map<number, ShiftAssignmentEntity[]>,
    overridesByEmployee: Map<number, ShiftOverrideEntity[]>,
    vacationsByEmployee: Map<number, VacationEntity[]>,
    permissionsByEmployee: Map<number, PermissionEntity[]>,
    incidentsByEmployee: Map<number, IncidentEntity[]>,
    timeEntriesByEmployee: Map<number, TimeEntryEntity[]>,
    calendarDaysByEmployee: Map<number, Map<string, CalendarDayEntity>>
  ): ScheduleRowDto[] {
    return employees.map((employee) => {
      const employeeAssignments = assignmentsByEmployee.get(employee.id) ?? [];
      const employeeOverrides = overridesByEmployee.get(employee.id) ?? [];
      const employeeVacations = vacationsByEmployee.get(employee.id) ?? [];
      const employeePermissions = permissionsByEmployee.get(employee.id) ?? [];
      const employeeIncidents = incidentsByEmployee.get(employee.id) ?? [];
      const employeeTimeEntries = timeEntriesByEmployee.get(employee.id) ?? [];
      const employeeCalendarDays = calendarDaysByEmployee.get(employee.id) ?? new Map<string, CalendarDayEntity>();

      return {
        employeeId: employee.id,
        employeeNumero: employee.numero,
        employeeNombre: employee.nombreEmpleado,
        companyId: employee.company?.id ?? null,
        companyName: employee.company?.name ?? null,
        days: days.map((day) =>
          this.resolveDay({
            employee,
            date: day.date,
            assignments: employeeAssignments,
            overrides: employeeOverrides,
            calendarDay: employeeCalendarDays.get(day.date) ?? null,
            vacations: employeeVacations,
            permissions: employeePermissions,
            incidents: employeeIncidents,
            timeEntries: employeeTimeEntries
          })
        )
      };
    });
  }

  private calculateWorkedMinutes(timeEntries: TimeEntryEntity[]) {
    let total = 0;
    let openEntry: TimeEntryEntity | null = null;
    for (const entry of timeEntries) {
      if (entry.tipo === 'ENTRADA') {
        openEntry = entry;
      } else if (entry.tipo === 'SALIDA' && openEntry) {
        total += Math.max(0, (timeToMinutes(entry.hora) ?? 0) - (timeToMinutes(openEntry.hora) ?? 0));
        openEntry = null;
      }
    }
    return total;
  }
}
