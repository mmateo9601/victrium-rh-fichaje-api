import { DataSource } from 'typeorm';

import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  it('creates an incident for the current employee', async () => {
    const company = { id: 11, name: 'Victrium', code: 'VIC', active: true } as CompanyEntity;
    const employee = {
      id: 7,
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      email: 'ada@example.com',
      dni: '12345678A',
      company,
      user: { id: 1, roles: [], company },
      vacations: [],
      incidents: []
    } as unknown as EmployeeEntity;

    const savedIncidents: IncidentEntity[] = [];
    const employeeRepository = { findOne: jest.fn().mockResolvedValue(employee) };
    const companyRepository = { findOne: jest.fn().mockResolvedValue(company) };
    const incidentRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => {
        savedIncidents.push(value);
        return value;
      }),
      createQueryBuilder: jest.fn()
    };
    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === EmployeeEntity) return employeeRepository;
        if (entity === CompanyEntity) return companyRepository;
        if (entity === IncidentEntity) return incidentRepository;
        throw new Error('Unexpected entity');
      })
    };
    const dataSource = { transaction: jest.fn().mockImplementation(async (callback) => callback(manager)) } as unknown as DataSource;
    const tenantScope = { assertResourceAccess: jest.fn() } as never;
    const service = new IncidentsService(dataSource, incidentRepository as never, tenantScope);

    const result = await service.create(
      {
        descripcion: 'Portátil sin batería',
        resumen: 'Equipo averiado',
        dia: '2026-08-20'
      },
      {
        userId: 1,
        companyId: 11,
        employeeId: 7,
        roles: ['ROLE_USER'],
        canAccessAll: false
      }
    );

    expect(result.resumen).toBe('Equipo averiado');
    expect(savedIncidents).toHaveLength(1);
  });

  it('updates resolution state', async () => {
    const incident = {
      id: 5,
      descripcion: 'Portátil sin batería',
      resumen: 'Equipo averiado',
      dia: '2026-08-20',
      resuelta: false,
      explicacion: null,
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
    } as unknown as IncidentEntity;

    const incidentRepository = {
      findOne: jest.fn().mockResolvedValue(incident),
      save: jest.fn().mockImplementation(async (value) => value),
      createQueryBuilder: jest.fn()
    };
    const dataSource = { transaction: jest.fn().mockImplementation(async (callback) => callback({
      getRepository: jest.fn().mockReturnValue(incidentRepository)
    })) } as unknown as DataSource;
    const tenantScope = { assertResourceAccess: jest.fn() } as never;
    const service = new IncidentsService(dataSource, incidentRepository as never, tenantScope);

    const updated = await service.update(
      5,
      { resuelta: true, explicacion: 'Resuelto por soporte' },
      {
        userId: 1,
        companyId: 11,
        employeeId: 7,
        roles: ['ROLE_RRHH'],
        canAccessAll: false
      }
    );

    expect(updated.resuelta).toBe(true);
    expect(updated.explicacion).toBe('Resuelto por soporte');
  });
});
