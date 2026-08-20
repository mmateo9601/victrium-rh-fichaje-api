import { DataSource } from 'typeorm';

import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { VacationStatus } from '../../database/entities/vacation-status.enum';
import { VacationsService } from './vacations.service';

describe('VacationsService', () => {
  it('creates a vacation for the current employee and keeps it pending', async () => {
    const company = { id: 11, name: 'Victrium', code: 'VIC', active: true } as CompanyEntity;
    const employee = {
      id: 7,
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      email: 'ada@example.com',
      dni: '12345678A',
      company,
      user: { id: 1, roles: [], company },
      vacations: []
    } as unknown as EmployeeEntity;

    const savedVacations: VacationEntity[] = [];
    const employeeRepository = {
      findOne: jest.fn().mockResolvedValue(employee)
    };
    const companyRepository = {
      findOne: jest.fn().mockResolvedValue(company)
    };
    const vacationRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => {
        savedVacations.push(value);
        return value;
      }),
      createQueryBuilder: jest.fn()
    };
    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === EmployeeEntity) return employeeRepository;
        if (entity === CompanyEntity) return companyRepository;
        if (entity === VacationEntity) return vacationRepository;
        throw new Error('Unexpected entity');
      })
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => callback(manager))
    } as unknown as DataSource;

    const tenantScope = {
      assertResourceAccess: jest.fn(),
      toContext: jest.fn()
    } as never;

    const service = new VacationsService(dataSource, vacationRepository as never, tenantScope);
    const result = await service.create(
      {
        inicio: '2026-08-21',
        fin: '2026-08-25'
      },
      {
        userId: 1,
        companyId: 11,
        employeeId: 7,
        roles: ['ROLE_USER'],
        canAccessAll: false
      }
    );

    expect(result.estado).toBe(VacationStatus.PENDIENTE);
    expect(result.aprobado).toBe(false);
    expect(savedVacations).toHaveLength(1);
    expect(employeeRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('marks vacations as approved and denied', async () => {
    const vacation = {
      id: 22,
      inicio: '2026-08-21',
      fin: '2026-08-25',
      consumidas: false,
      aprobado: false,
      estado: VacationStatus.PENDIENTE,
      company: { id: 11, name: 'Victrium', code: 'VIC', active: true },
      employee: {
        id: 7,
        numero: 'EMP001',
        nombreEmpleado: 'Ada Lovelace',
        email: 'ada@example.com',
        dni: '12345678A',
        company: { id: 11 },
        user: { id: 1 }
      }
    } as unknown as VacationEntity;

    const vacationRepository = {
      findOne: jest.fn().mockResolvedValue(vacation),
      save: jest.fn().mockImplementation(async (value) => value),
      createQueryBuilder: jest.fn()
    };
    const dataSource = {
      transaction: jest.fn()
    } as unknown as DataSource;
    const tenantScope = {
      assertResourceAccess: jest.fn()
    } as never;

    const service = new VacationsService(dataSource, vacationRepository as never, tenantScope);
    const approved = await service.approve(22, {
      userId: 1,
      companyId: 11,
      employeeId: 7,
      roles: ['ROLE_RRHH'],
      canAccessAll: false
    });
    const denied = await service.deny(22, {
      userId: 1,
      companyId: 11,
      employeeId: 7,
      roles: ['ROLE_RRHH'],
      canAccessAll: false
    });

    expect(approved.estado).toBe(VacationStatus.APROBADO);
    expect(denied.estado).toBe(VacationStatus.DENEGADO);
    expect(vacationRepository.save).toHaveBeenCalledTimes(2);
  });
});
