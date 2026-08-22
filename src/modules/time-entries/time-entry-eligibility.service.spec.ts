import { ClockService } from '../../common/time/clock.service';
import { ShiftsService } from '../shifts/shifts.service';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { TimeEntryEligibilityService } from './time-entry-eligibility.service';

describe('TimeEntryEligibilityService', () => {
  function createService(now: string, locationAssignment: Record<string, unknown> | null = null) {
    const clock = {
      now: jest.fn().mockReturnValue(new Date(now))
    } as unknown as ClockService;

    const shiftsService = {
      getMySchedule: jest.fn().mockResolvedValue({
        rows: [
          {
            days: [
              {
                date: '2026-08-21',
                status: 'WORKING',
                shift: { id: 7, name: 'Mañana', code: 'M', color: '#0f766e' },
                expectedStart: '08:00:00',
                expectedEnd: '17:00:00'
              }
            ]
          }
        ]
      })
    } as unknown as ShiftsService;

    const locationAssignmentsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(locationAssignment)
      })
    } as unknown as jest.Mocked<{
      createQueryBuilder: () => {
        leftJoinAndSelect: () => unknown;
        leftJoin: () => unknown;
        where: () => unknown;
        andWhere: () => unknown;
        orderBy: () => unknown;
        addOrderBy: () => unknown;
        getOne: () => Promise<Record<string, unknown> | null>;
      };
    }>;

    return new TimeEntryEligibilityService(clock, shiftsService, locationAssignmentsRepository as never);
  }

  const user = {
    id: 1,
    deBaja: false,
    company: {
      id: 7,
      name: 'Victrium',
      timezone: 'Europe/Madrid',
      workPolicy: {
        earlyClockInMinutes: 10
      }
    },
    employee: {
      id: 21,
      deBaja: false,
      company: {
        id: 7,
        name: 'Victrium',
        timezone: 'Europe/Madrid',
        workPolicy: {
          earlyClockInMinutes: 10
        }
      }
    }
  } as never;

  const context = {
    userId: 1,
    companyId: 7,
    employeeId: 21,
    roles: ['ROLE_USER'],
    canAccessAll: false
  };

  it.each([
    ['too early', '2026-08-21T05:49:59.000Z', false, 'TOO_EARLY'],
    ['boundary allowed', '2026-08-21T05:50:00.000Z', true, 'ALLOWED'],
    ['inside window', '2026-08-21T05:59:59.000Z', true, 'ALLOWED'],
    ['start time', '2026-08-21T06:00:00.000Z', true, 'ALLOWED']
  ])('returns %s at %s', async (_label, now, canStart, reason) => {
    const service = createService(now);
    const result = await service.evaluate(user, context);

    expect(result.canStart).toBe(canStart);
    expect(result.reason).toBe(reason);
  });

  it('blocks when there is already an active session', async () => {
    const service = createService('2026-08-21T05:50:00.000Z');
    const result = await service.evaluate(user, context, {
      activeSession: {
        id: 99,
        usuario: user,
        startedAt: new Date('2026-08-21T05:50:00.000Z'),
        finishedAt: null,
        state: 'WORKING',
        source: 'web',
        breaks: []
      } as unknown as TimeEntrySessionEntity
    });

    expect(result.canStart).toBe(false);
    expect(result.reason).toBe('SESSION_ACTIVE');
  });
});
