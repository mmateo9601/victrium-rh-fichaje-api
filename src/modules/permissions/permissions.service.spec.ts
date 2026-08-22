import { DataSource } from 'typeorm';

import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { PermissionStatus } from '../../database/entities/permission-status.enum';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  it('creates a pending permission for the current employee', async () => {
    const company = { id: 11, name: 'Victrium', code: 'VIC', active: true } as CompanyEntity;
    const employee = {
      id: 7,
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      email: 'ada@example.com',
      dni: '12345678A',
      company,
      user: { id: 1, roles: [], company },
      permissions: []
    } as unknown as EmployeeEntity;

    const savedPermissions: PermissionEntity[] = [];
    const employeeRepository = { findOne: jest.fn().mockResolvedValue(employee) };
    const companyRepository = { findOne: jest.fn().mockResolvedValue(company) };
    const permissionRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => {
        savedPermissions.push(value);
        return value;
      }),
      remove: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn()
    };
    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === EmployeeEntity) return employeeRepository;
        if (entity === CompanyEntity) return companyRepository;
        if (entity === PermissionEntity) return permissionRepository;
        throw new Error('Unexpected entity');
      })
    };
    const dataSource = { transaction: jest.fn().mockImplementation(async (callback) => callback(manager)) } as unknown as DataSource;
    const tenantScope = { assertResourceAccess: jest.fn() } as never;
    const service = new PermissionsService(dataSource, permissionRepository as never, tenantScope);

    const result = await service.create(
      {
        dia: '2026-08-20',
        horaInicio: '08:00',
        horaFin: '10:00',
        descripcion: 'Cita médica'
      },
      {
        userId: 1,
        companyId: 11,
        employeeId: 7,
        roles: ['ROLE_USER'],
        canAccessAll: false
      }
    );

    expect(result.estado).toBe(PermissionStatus.PENDIENTE);
    expect(result.aprobado).toBe(false);
    expect(savedPermissions).toHaveLength(1);
    expect(employeeRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('approves and denies permissions', async () => {
    const permission = {
      id: 22,
      dia: '2026-08-20',
      horaInicio: '08:00',
      horaFin: '10:00',
      descripcion: 'Cita médica',
      aprobado: false,
      estado: PermissionStatus.PENDIENTE,
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
    } as unknown as PermissionEntity;

    const permissionRepository = {
      findOne: jest.fn().mockResolvedValue(permission),
      save: jest.fn().mockImplementation(async (value) => value),
      remove: jest.fn(),
      createQueryBuilder: jest.fn()
    };
    const dataSource = { transaction: jest.fn() } as unknown as DataSource;
    const tenantScope = { assertResourceAccess: jest.fn() } as never;
    const service = new PermissionsService(dataSource, permissionRepository as never, tenantScope);

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

    expect(approved.estado).toBe(PermissionStatus.APROBADO);
    expect(denied.estado).toBe(PermissionStatus.DENEGADO);
    expect(permissionRepository.save).toHaveBeenCalledTimes(2);
  });

  it('does not expose employee email or dni in public responses', () => {
    const permission = {
      id: 22,
      dia: '2026-08-20',
      horaInicio: '08:00',
      horaFin: '10:00',
      descripcion: 'Cita médica',
      aprobado: false,
      estado: PermissionStatus.PENDIENTE,
      company: { id: 11, name: 'Victrium', code: 'VIC', active: true },
      employee: {
        id: 7,
        numero: 'EMP001',
        nombreEmpleado: 'Ada Lovelace',
        email: 'ada@example.com',
        dni: '12345678A'
      }
    } as unknown as PermissionEntity;

    const service = new PermissionsService({} as never, {} as never, {} as never);
    const response = service.toDto(permission);

    expect(response).not.toHaveProperty('employeeEmail');
    expect(response).not.toHaveProperty('employeeDni');
    expect(response.employeeNombre).toBe('Ada Lovelace');
  });
});
