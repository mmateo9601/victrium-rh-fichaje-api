import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ClockService } from '../../common/time/clock.service';
import {
  addMinutesToTimeZoneDate,
  getTimeZoneDayBounds,
  parseTimeZoneDateTime,
  formatTimeZoneDateTime
} from '../../common/time/timezone.utils';
import { PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { EmployeeLocationAssignmentEntity } from '../../database/entities/employee-location-assignment.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { ShiftsService } from '../shifts/shifts.service';
import { TimeEntryEligibilityDto, TimeEntryEligibilityReason } from './dto/time-entry-eligibility.dto';

type EligibilitySnapshot = {
  activeSession?: TimeEntrySessionEntity | null;
  latestSessionToday?: TimeEntrySessionEntity | null;
};

type PolicyRecord = Record<string, unknown> | null | undefined;

function buildFallbackEligibility(
  user: UserEntity,
  now: Date,
  reason: TimeEntryEligibilityReason,
  message: string,
  scheduledStart: string | null = null,
  scheduledEnd: string | null = null
): TimeEntryEligibilityDto {
  const timeZone = user.company?.timezone ?? user.employee?.company?.timezone ?? 'Europe/Madrid';
  const evaluatedAt = formatTimeZoneDateTime(now, timeZone);
  return {
    canStart: false,
    reason,
    message,
    evaluatedAt,
    allowedFrom: null,
    allowedUntil: null,
    scheduledStart,
    scheduledEnd,
    earlyClockInMinutes: null,
    companyId: user.company?.id ?? user.employee?.company?.id ?? null,
    companyName: user.company?.name ?? user.employee?.company?.name ?? null,
    workLocationId: null,
    workLocationName: null,
    workLocationCode: null,
    shiftId: null,
    shiftName: null,
    shiftCode: null
  };
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null;
}

function getPolicyNumber(policy: PolicyRecord, key: string, fallback = 0) {
  return toNumber(policy?.[key]) ?? fallback;
}

function getPolicyBoolean(policy: PolicyRecord, key: string, fallback = false) {
  return toBoolean(policy?.[key]) ?? fallback;
}

function buildReasonMessage(reason: TimeEntryEligibilityReason, allowedFrom: string | null, scheduledStart: string | null) {
  switch (reason) {
    case 'ALLOWED':
      return 'Puede iniciar la jornada';
    case 'TOO_EARLY':
      return allowedFrom ? `Podrás iniciar tu jornada a partir de ${allowedFrom}.` : 'Todavía es demasiado pronto para fichar.';
    case 'OUT_OF_WINDOW':
      return 'La ventana de fichaje para hoy ya ha finalizado.';
    case 'NO_SCHEDULE':
      return 'No tienes un turno habilitado para fichar hoy.';
    case 'EMPLOYEE_INACTIVE':
      return 'Tu perfil no está activo para fichar.';
    case 'ABSENCE_BLOCKS_CLOCK_IN':
      return 'Tienes una ausencia que bloquea el fichaje de hoy.';
    case 'SESSION_ACTIVE':
      return 'Ya tienes una jornada activa.';
    case 'SESSION_COMPLETED':
      return 'La jornada de hoy ya está cerrada.';
    case 'NO_WORK_LOCATION':
      return 'No tienes un centro de trabajo asignado para fichar.';
    default:
      return scheduledStart ? `La jornada empieza a las ${scheduledStart}.` : 'No es posible iniciar la jornada ahora.';
  }
}

@Injectable()
export class TimeEntryEligibilityService {
  constructor(
    private readonly clock: ClockService,
    private readonly shiftsService: ShiftsService,
    @InjectRepository(EmployeeLocationAssignmentEntity)
    private readonly locationAssignmentsRepository: Repository<EmployeeLocationAssignmentEntity>
  ) {}

  async evaluate(
    user: UserEntity,
    context: PrincipalTenantContext,
    snapshot: EligibilitySnapshot = {}
  ): Promise<TimeEntryEligibilityDto> {
    const now = this.clock.now();
    const timeZone = user.company?.timezone ?? user.employee?.company?.timezone ?? 'Europe/Madrid';
    const evaluatedAt = formatTimeZoneDateTime(now, timeZone);
    const dayBounds = getTimeZoneDayBounds(now, timeZone);
    const employeeId = user.employee?.id ?? context.employeeId ?? null;

    if (!employeeId) {
      return buildFallbackEligibility(
        user,
        now,
        'NO_SCHEDULE',
        'No tienes un empleado vinculado para mostrar tu planificación de hoy.'
      );
    }

    let schedule;
    try {
      schedule = await this.shiftsService.getMySchedule(context, {
        from: dayBounds.dateString,
        to: dayBounds.dateString
      });
    } catch {
      return buildFallbackEligibility(
        user,
        now,
        'NO_SCHEDULE',
        'No hemos podido resolver tu planificación de hoy. La jornada seguirá disponible si tu empresa lo permite.'
      );
    }

    const day = schedule.rows[0]?.days[0] ?? null;
    const locationAssignment = employeeId
      ? await this.locationAssignmentsRepository
          .createQueryBuilder('assignment')
          .leftJoinAndSelect('assignment.workLocation', 'workLocation')
          .leftJoinAndSelect('workLocation.company', 'workLocationCompany')
          .leftJoin('assignment.employee', 'employee')
          .where('employee.id = :employeeId', { employeeId })
          .andWhere('assignment.validFrom <= :today', { today: dayBounds.dateString })
          .andWhere('(assignment.validTo IS NULL OR assignment.validTo >= :today)', { today: dayBounds.dateString })
          .orderBy('assignment.primary', 'DESC')
          .addOrderBy('assignment.validFrom', 'DESC')
          .addOrderBy('assignment.id', 'DESC')
          .getOne()
      : null;

    const policy = (user.company?.workPolicy ?? user.employee?.company?.workPolicy ?? null) as PolicyRecord;
    const earlyClockInMinutes = getPolicyNumber(policy, 'earlyClockInMinutes', 10);
    const allowClockInWithoutSchedule = getPolicyBoolean(policy, 'allowClockInWithoutSchedule', false);
    const allowClockInOnNonWorkingDay = getPolicyBoolean(policy, 'allowClockInOnNonWorkingDay', false);
    const requireWorkLocation = getPolicyBoolean(policy, 'requireWorkLocationForClockIn', false);

    const activeSession = snapshot.activeSession ?? null;
    const latestSessionToday = snapshot.latestSessionToday ?? null;

    const scheduledStart = day?.expectedStart
      ? parseTimeZoneDateTime(`${day.date}T${day.expectedStart}`, timeZone)
      : null;
    const scheduledEnd = day?.expectedEnd
      ? parseTimeZoneDateTime(`${day.date}T${day.expectedEnd}`, timeZone)
      : null;
    const allowedFrom = scheduledStart ? addMinutesToTimeZoneDate(scheduledStart, -earlyClockInMinutes) : null;

    let canStart = false;
    let reason: TimeEntryEligibilityReason = 'NO_SCHEDULE';
    let message = buildReasonMessage(reason, allowedFrom ? formatTimeZoneDateTime(allowedFrom, timeZone) : null, day?.expectedStart ?? null);
    let allowedUntil = scheduledEnd;

    if (user.deBaja || user.employee?.deBaja) {
      reason = 'EMPLOYEE_INACTIVE';
      message = buildReasonMessage(reason, null, null);
      allowedUntil = null;
    } else if (activeSession) {
      reason = 'SESSION_ACTIVE';
      message = buildReasonMessage(reason, null, null);
      allowedUntil = null;
    } else if (latestSessionToday?.finishedAt) {
      reason = 'SESSION_COMPLETED';
      message = buildReasonMessage(reason, null, null);
      allowedUntil = null;
    } else if (day?.status === 'VACATION' || day?.status === 'PERMISSION' || day?.status === 'HOLIDAY') {
      if (allowClockInOnNonWorkingDay) {
        reason = 'ALLOWED';
        canStart = true;
        message = buildReasonMessage(reason, null, null);
      } else {
        reason = 'ABSENCE_BLOCKS_CLOCK_IN';
        message = buildReasonMessage(reason, null, null);
      }
    } else if (!day || day.status === 'NO_SHIFT' || day.status === 'OFF') {
      if (allowClockInWithoutSchedule) {
        reason = 'ALLOWED';
        canStart = true;
        allowedUntil = null;
        message = buildReasonMessage(reason, null, day?.expectedStart ?? null);
      } else {
        reason = 'NO_SCHEDULE';
        message = buildReasonMessage(reason, null, null);
        allowedUntil = null;
      }
    } else if (!day.shift || !day.expectedStart || !day.expectedEnd) {
      reason = 'NO_SCHEDULE';
      message = buildReasonMessage(reason, null, null);
      allowedUntil = null;
    } else if (requireWorkLocation && !locationAssignment) {
      reason = 'NO_WORK_LOCATION';
      message = buildReasonMessage(reason, null, null);
      allowedUntil = null;
    } else if (allowedFrom && now < allowedFrom) {
      reason = 'TOO_EARLY';
      message = buildReasonMessage(reason, formatTimeZoneDateTime(allowedFrom, timeZone), day.expectedStart);
    } else if (allowedUntil && now > allowedUntil) {
      reason = 'OUT_OF_WINDOW';
      message = buildReasonMessage(reason, null, null);
    } else {
      reason = 'ALLOWED';
      canStart = true;
      message = buildReasonMessage(reason, null, null);
    }

    return {
      canStart,
      reason,
      message,
      evaluatedAt,
      allowedFrom: allowedFrom ? formatTimeZoneDateTime(allowedFrom, timeZone) : null,
      allowedUntil: allowedUntil ? formatTimeZoneDateTime(allowedUntil, timeZone) : null,
      scheduledStart: scheduledStart ? formatTimeZoneDateTime(scheduledStart, timeZone) : null,
      scheduledEnd: scheduledEnd ? formatTimeZoneDateTime(scheduledEnd, timeZone) : null,
      earlyClockInMinutes,
      companyId: user.company?.id ?? user.employee?.company?.id ?? null,
      companyName: user.company?.name ?? user.employee?.company?.name ?? null,
      workLocationId: locationAssignment?.workLocation?.id ?? null,
      workLocationName: locationAssignment?.workLocation?.name ?? null,
      workLocationCode: locationAssignment?.workLocation?.code ?? null,
      shiftId: day?.shift?.id ?? null,
      shiftName: day?.shift?.name ?? null,
      shiftCode: day?.shift?.code ?? null
    };
  }
}
