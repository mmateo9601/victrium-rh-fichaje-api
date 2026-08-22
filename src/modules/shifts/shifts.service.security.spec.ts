import { AppError } from '../../common/errors/app-error';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { ShiftsService } from './shifts.service';

describe('ShiftsService security', () => {
  it('blocks cross-tenant employee schedules when an employeeId is supplied', async () => {
    const foreignCompany = { id: 22, name: 'Foreign', code: 'FOR', active: true } as CompanyEntity;
    const foreignEmployee = {
      id: 99,
      numero: 'EMP099',
      nombreEmpleado: 'Foreign User',
      company: foreignCompany,
      user: { id: 77, company: foreignCompany }
    } as unknown as EmployeeEntity;

    const employeesRepository = {
      findOne: jest.fn().mockResolvedValue(foreignEmployee),
      createQueryBuilder: jest.fn()
    };

    const service = new ShiftsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      employeesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        assertResourceAccess: jest.fn(() => {
          throw new AppError('FORBIDDEN_CROSS_TENANT', 'Recurso fuera del alcance de la empresa', 404);
        })
      } as never,
      {
        buildRange: jest.fn()
      } as never
    );

    await expect(
      service.getSchedule(
        { employeeId: foreignEmployee.id },
        {
          userId: 1,
          companyId: 11,
          employeeId: null,
          roles: ['ROLE_RRHH'],
          canAccessAll: false
        }
      )
    ).rejects.toThrow(AppError);
  });
});
