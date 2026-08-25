import { EmployeeLocationAssignmentEntity } from '../../database/entities/employee-location-assignment.entity';
import { EmploymentTermsEntity } from '../../database/entities/employment-terms.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { ShiftDayEntity } from '../../database/entities/shift-day.entity';
import { ShiftOverrideEntity } from '../../database/entities/shift-override.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { WorkScheduleResolverService } from './work-schedule-resolver.service';

describe('WorkScheduleResolverService', () => {
  function createResolver() {
    return new WorkScheduleResolverService();
  }

  function createDay(overrides: Partial<ShiftDayEntity> = {}) {
    return {
      id: 1,
      dayOfWeek: 1,
      working: true,
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakMinutes: 30,
      workingMinutes: 480,
      crossesMidnight: false,
      ...overrides
    } as ShiftDayEntity;
  }

  function createShift() {
    return {
      id: 10,
      name: 'General',
      code: 'GEN',
      color: '#123456',
      days: [createDay()]
    } as ShiftEntity;
  }

  function createRotationShift() {
    return {
      id: 11,
      name: 'Rotación',
      code: 'ROT',
      color: '#654321',
      rotationStartDate: '2026-08-24',
      rotationPattern: [
        {
          working: true,
          startTime: '06:00:00',
          endTime: '14:00:00',
          breakMinutes: 30,
          workingMinutes: 450,
          crossesMidnight: false
        },
        {
          working: true,
          startTime: '14:00:00',
          endTime: '22:00:00',
          breakMinutes: 30,
          workingMinutes: 450,
          crossesMidnight: false
        },
        {
          working: false,
          startTime: null,
          endTime: null,
          breakMinutes: 0,
          workingMinutes: 0,
          crossesMidnight: false
        }
      ],
      days: []
    } as unknown as ShiftEntity;
  }

  function createLocation(id: number, code: string, name: string) {
    return {
      id,
      code,
      name
    } as WorkLocationEntity;
  }

  function createTerms(overrides: Partial<EmploymentTermsEntity> = {}) {
    return {
      id: 31,
      active: true,
      effectiveFrom: '2026-08-01',
      effectiveTo: null,
      weeklyContractMinutes: 2400,
      annualContractMinutes: 86400,
      workingPercentage: '100.00',
      contractType: 'FULL_TIME',
      policyVersion: 1,
      policySnapshot: null,
      primaryWorkLocation: createLocation(91, 'MAD-CENTRO', 'Madrid Centro'),
      ...overrides
    } as EmploymentTermsEntity;
  }

  function createEmployee(workPolicy: Record<string, unknown> | null = null) {
    return {
      id: 21,
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      company: {
        id: 7,
        name: 'Victrium',
        workPolicy
      }
    } as EmployeeEntity;
  }

  function createEntry(id: number, dia: string, hora: string, tipo: 'ENTRADA' | 'SALIDA') {
    return {
      id,
      dia,
      hora,
      tipo
    } as TimeEntryEntity;
  }

  it('returns no policy when the company has no work policy configured', () => {
    const resolver = createResolver();
    const result = resolver.resolveDay({
      employee: createEmployee(),
      date: '2026-08-24',
      assignments: [],
      overrides: [],
      locationAssignments: [],
      employmentTerms: [],
      calendarDay: null,
      vacations: [],
      permissions: [],
      incidents: [],
      timeEntries: []
    });

    expect(result.policy).toBeNull();
  });

  it('evaluates policy warnings and violations from the company policy', () => {
    const resolver = createResolver();
    const result = resolver.resolveDay({
      employee: createEmployee({
        maxDailyMinutes: 480,
        minimumBreakMinutes: 30,
        lateThresholdMinutes: 10
      }),
      date: '2026-08-24',
      assignments: [
        {
          id: 1,
          employee: createEmployee({
            maxDailyMinutes: 480,
            minimumBreakMinutes: 30,
            lateThresholdMinutes: 10
          }),
          shift: createShift(),
          validFrom: '2026-08-01',
          validTo: null,
          active: true
        } as unknown as never
      ],
      overrides: [],
      locationAssignments: [],
      employmentTerms: [],
      calendarDay: null,
      vacations: [],
      permissions: [],
      incidents: [],
      timeEntries: [
        createEntry(1, '2026-08-24', '08:15:00', 'ENTRADA'),
        createEntry(2, '2026-08-24', '12:00:00', 'SALIDA'),
        createEntry(3, '2026-08-24', '12:10:00', 'ENTRADA'),
        createEntry(4, '2026-08-24', '17:00:00', 'SALIDA')
      ]
    });

    expect(result.policy).not.toBeNull();
    expect(result.policy?.configured).toBe(true);
    expect(result.policy?.actualBreakMinutes).toBe(10);
    expect(result.policy?.minimumBreakMinutes).toBe(30);
    expect(result.policy?.warnings).toContain('Retraso superior al umbral configurado: 15 min frente a 10 min');
    expect(result.policy?.violations).toEqual(
      expect.arrayContaining([
        'Descanso insuficiente: 10 min frente a 30 min configurados',
        'Jornada diaria superada: 515 min frente a 480 min permitidos'
      ])
    );
  });

  it('detects night work and overtime thresholds when configured', () => {
    const resolver = createResolver();
    const result = resolver.resolveDay({
      employee: createEmployee({
        maxDailyMinutes: 450,
        overtimeWarningMinutes: 30,
        allowNightWork: false,
        nightWorkStart: '22:00:00',
        nightWorkEnd: '06:00:00'
      }),
      date: '2026-08-24',
      assignments: [
        {
          id: 1,
          employee: createEmployee({
            maxDailyMinutes: 450,
            overtimeWarningMinutes: 30,
            allowNightWork: false,
            nightWorkStart: '22:00:00',
            nightWorkEnd: '06:00:00'
          }),
          shift: createShift(),
          validFrom: '2026-08-01',
          validTo: null,
          active: true
        } as unknown as never
      ],
      overrides: [],
      locationAssignments: [],
      employmentTerms: [],
      calendarDay: null,
      vacations: [],
      permissions: [],
      incidents: [],
      timeEntries: [
        createEntry(1, '2026-08-24', '22:00:00', 'ENTRADA'),
        createEntry(2, '2026-08-24', '06:30:00', 'SALIDA')
      ]
    });

    expect(result.policy).not.toBeNull();
    expect(result.policy?.overtimeMinutes).toBe(30);
    expect(result.policy?.nightWorkMinutes).toBe(480);
    expect(result.policy?.warnings).toContain('Horas extra registradas: 30 min');
    expect(result.policy?.violations).toContain('Trabajo nocturno no permitido: 480 min entre 22:00:00 y 06:00:00');
  });

  it('resolves rotation patterns before weekly shift days', () => {
    const resolver = createResolver();
    const result = resolver.resolveDay({
      employee: createEmployee(),
      date: '2026-08-25',
      assignments: [
        {
          id: 2,
          employee: createEmployee(),
          shift: createRotationShift(),
          validFrom: '2026-08-24',
          validTo: null,
          active: true
        } as unknown as never
      ],
      overrides: [],
      locationAssignments: [],
      employmentTerms: [],
      calendarDay: null,
      vacations: [],
      permissions: [],
      incidents: [],
      timeEntries: [
        createEntry(1, '2026-08-25', '14:00:00', 'ENTRADA'),
        createEntry(2, '2026-08-25', '22:00:00', 'SALIDA')
      ]
    });

    expect(result.status).toBe('WORKING');
    expect(result.expectedStart).toBe('14:00:00');
    expect(result.expectedEnd).toBe('22:00:00');
    expect(result.expectedMinutes).toBe(450);
  });

  it('prefers override location and resolves employment terms for the day', () => {
    const resolver = createResolver();
    const overrideLocation = createLocation(101, 'MAD-OVR', 'Override');
    const assignmentLocation = createLocation(102, 'MAD-ASG', 'Assignment');
    const employeeLocation = createLocation(103, 'MAD-EMP', 'Employee');
    const termsLocation = createLocation(104, 'MAD-TERM', 'Terms');
    const result = resolver.resolveDay({
      employee: createEmployee(),
      date: '2026-08-26',
      assignments: [
        {
          id: 3,
          employee: createEmployee(),
          shift: createShift(),
          validFrom: '2026-08-01',
          validTo: null,
          active: true,
          workLocation: assignmentLocation
        } as unknown as never
      ],
      overrides: [
        {
          id: 4,
          employee: createEmployee(),
          date: '2026-08-26',
          type: 'SHIFT',
          shift: createShift(),
          workLocation: overrideLocation
        } as unknown as ShiftOverrideEntity
      ],
      locationAssignments: [
        {
          id: 5,
          employee: createEmployee(),
          workLocation: employeeLocation,
          validFrom: '2026-08-01',
          validTo: null,
          primary: true
        } as unknown as EmployeeLocationAssignmentEntity
      ],
      employmentTerms: [
        createTerms({
          primaryWorkLocation: termsLocation,
          policyVersion: 3
        })
      ],
      calendarDay: null,
      vacations: [],
      permissions: [],
      incidents: [],
      timeEntries: [
        createEntry(1, '2026-08-26', '08:00:00', 'ENTRADA'),
        createEntry(2, '2026-08-26', '17:00:00', 'SALIDA')
      ]
    });

    expect(result.workLocationId).toBe(101);
    expect(result.workLocationSource).toBe('override');
    expect(result.workLocationName).toBe('Override');
    expect(result.employmentTermsId).toBe(31);
    expect(result.employmentTermsContractType).toBe('FULL_TIME');
    expect(result.employmentTermsWorkingPercentage).toBe('100.00');
  });
});
