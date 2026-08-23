import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { ACTIVE_ACCESS_ROLES, normalizeRoleNames } from '../../common/auth/role-access';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RoleName } from '../../database/entities/role-name.enum';
import { RoleEntity } from '../../database/entities/role.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

type EmployeeListQuery = PaginationQueryDto & {
  search?: string;
  active?: string;
  working?: string;
  companyId?: number;
};

@Injectable()
export class EmployeesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  private assertAssignableRoles(roles: RoleName[], context: PrincipalTenantContext) {
    const normalizedRoles = [...new Set(normalizeRoleNames(roles))] as RoleName[];

    if (!context.roles.includes(RoleName.ROLE_SUPER_ADMIN) && normalizedRoles.includes(RoleName.ROLE_SUPER_ADMIN)) {
      throw new AppError('FORBIDDEN_ROLE_ASSIGNMENT', 'No puedes asignar el rol superadministrador', 403);
    }

    if (normalizedRoles.some((role) => !ACTIVE_ACCESS_ROLES.includes(role))) {
      throw new AppError('FORBIDDEN_ROLE_ASSIGNMENT', 'No puedes asignar roles reservados', 403);
    }

    return normalizedRoles;
  }

  async create(dto: CreateEmployeeDto, context: PrincipalTenantContext): Promise<EmployeeResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const companyId = dto.companyId ?? context.companyId;
      if (!companyId && !context.canAccessAll) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }
      if (!context.canAccessAll && dto.companyId !== undefined && dto.companyId !== context.companyId) {
        throw new AppError('FORBIDDEN_CROSS_TENANT', 'No puedes crear empleados fuera de tu empresa', 403);
      }

      const company = await manager.getRepository(CompanyEntity).findOne({ where: { id: companyId ?? 0 } });
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }

      this.tenantScope.assertResourceAccess(company.id, context);

      const primaryWorkLocation =
        dto.primaryWorkLocationId === undefined || dto.primaryWorkLocationId === null
          ? null
          : await this.resolveWorkLocation(manager, dto.primaryWorkLocationId, company.id);
      if ((dto.deBaja === undefined || dto.deBaja === false) && !primaryWorkLocation) {
        throw new AppError('WORK_LOCATION_REQUIRED', 'El empleado activo requiere un centro habitual', 400);
      }

      const duplicateUser = await manager.getRepository(UserEntity).findOne({
        where: [{ numero: dto.numero }, { email: dto.email }, { dni: dto.dni }]
      });
      if (duplicateUser) {
        throw new AppError('EMPLOYEE_ALREADY_EXISTS', 'El empleado o su cuenta ya existen', 409);
      }

      const assignableRoles = this.assertAssignableRoles(dto.roles, context);

      const roleEntities = await manager.getRepository(RoleEntity).find({
        where: assignableRoles.map((role) => ({ rolNombre: role as RoleName }))
      });
      if (roleEntities.length !== assignableRoles.length) {
        throw new AppError('ROLE_NOT_FOUND', 'Alguno de los roles no existe', 404);
      }

      const userRepository = manager.getRepository(UserEntity);
      const employeeRepository = manager.getRepository(EmployeeEntity);

      const user = userRepository.create({
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        numero: dto.numero,
        nombreEmpleado: dto.nombreEmpleado,
        dni: dto.dni,
        diasVacaciones: dto.diasVacaciones ?? 0,
        horasGeneradas: dto.horasGeneradas ?? 0,
        working: dto.working ?? false,
        enVacaciones: dto.enVacaciones ?? false,
        deBaja: dto.deBaja ?? false,
        admin: false,
        roles: roleEntities,
        company
      });

      const savedUser = await userRepository.save(user);

      const employee = employeeRepository.create({
        numero: dto.numero,
        nombreEmpleado: dto.nombreEmpleado,
        email: dto.email,
        dni: dto.dni,
        diasVacaciones: dto.diasVacaciones ?? 0,
        horasGeneradas: dto.horasGeneradas ?? 0,
        working: dto.working ?? false,
        enVacaciones: dto.enVacaciones ?? false,
        deBaja: dto.deBaja ?? false,
        company,
        user: savedUser,
        primaryWorkLocation
      });

      const savedEmployee = await employeeRepository.save(employee);
      savedUser.employee = savedEmployee;
      savedUser.company = company;
      await userRepository.save(savedUser);

      return this.toDto(savedEmployee);
    });
  }

  async list(query: EmployeeListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.employeesRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.company', 'company')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.primaryWorkLocation', 'primaryWorkLocation')
      .leftJoinAndSelect('user.roles', 'role');

    if (query.search) {
      qb.andWhere(
        '(employee.numero LIKE :search OR employee.nombreEmpleado LIKE :search OR employee.email LIKE :search OR employee.dni LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('employee.deBaja = :deBaja', { deBaja: !active });
      }
    }

    if (query.working !== undefined) {
      const working = query.working === 'true' ? true : query.working === 'false' ? false : null;
      if (working !== null) {
        qb.andWhere('employee.working = :working', { working });
      }
    }

    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'employee', context);

    qb.distinct(true);
    const allowedSortFields = new Set(['id', 'numero', 'nombreEmpleado', 'email', 'dni', 'diasVacaciones', 'horasGeneradas', 'working', 'enVacaciones', 'deBaja']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`employee.${sortField}`, (query.order ?? 'asc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [employees, total] = await qb.getManyAndCount();
    return buildPaginatedResult(employees.map((employee) => this.toDto(employee)), total, page, pageSize);
  }

  async findByIdOrFail(id: number) {
    const employee = await this.employeesRepository.findOne({
      where: { id },
      relations: {
        company: true,
        primaryWorkLocation: true,
        user: {
          roles: true,
          company: true
        }
      }
    });
    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    return employee;
  }

  async getVisibleEmployee(id: number, context: PrincipalTenantContext) {
    const employee = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.user?.id);
    return this.toDto(employee);
  }

  async findMine(userId: number) {
    const employee = await this.employeesRepository.findOne({
      where: {
        user: {
          id: userId
        }
      },
      relations: {
        company: true,
        primaryWorkLocation: true,
        user: {
          roles: true,
          company: true
        }
      }
    });

    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }

    return this.toDto(employee);
  }

  async update(id: number, dto: UpdateEmployeeDto, context: PrincipalTenantContext) {
    return this.dataSource.transaction(async (manager) => {
      const employee = await manager.getRepository(EmployeeEntity).findOne({
        where: { id },
        relations: {
          company: true,
          primaryWorkLocation: true,
          user: {
            roles: true,
            company: true
          }
        }
      });

      if (!employee) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }

      this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.user?.id);

      const companyId = dto.companyId ?? employee.company.id;
      if (!context.canAccessAll && dto.companyId !== undefined && dto.companyId !== employee.company.id) {
        throw new AppError('FORBIDDEN_CROSS_TENANT', 'No puedes mover empleados a otra empresa', 403);
      }
      const company = await manager.getRepository(CompanyEntity).findOne({ where: { id: companyId } });
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }

      const primaryWorkLocation =
        dto.primaryWorkLocationId === undefined
          ? employee.primaryWorkLocation ?? null
          : dto.primaryWorkLocationId === null
            ? null
            : await this.resolveWorkLocation(manager, dto.primaryWorkLocationId, company.id);

      if (dto.numero !== undefined) {
        employee.numero = dto.numero;
      }
      if (dto.nombreEmpleado !== undefined) {
        employee.nombreEmpleado = dto.nombreEmpleado;
      }
      if (dto.email !== undefined) {
        employee.email = dto.email;
      }
      if (dto.dni !== undefined) {
        employee.dni = dto.dni;
      }
      if (dto.diasVacaciones !== undefined) {
        employee.diasVacaciones = dto.diasVacaciones;
      }
      if (dto.horasGeneradas !== undefined) {
        employee.horasGeneradas = dto.horasGeneradas;
      }
      if (dto.working !== undefined) {
        employee.working = dto.working;
      }
      if (dto.enVacaciones !== undefined) {
        employee.enVacaciones = dto.enVacaciones;
      }
      if (dto.deBaja !== undefined) {
        employee.deBaja = dto.deBaja;
      }
      employee.company = company;
      if (dto.primaryWorkLocationId !== undefined) {
        employee.primaryWorkLocation = primaryWorkLocation;
      }
      if ((dto.deBaja === undefined || dto.deBaja === false) && employee.primaryWorkLocation === null) {
        throw new AppError('WORK_LOCATION_REQUIRED', 'El empleado activo requiere un centro habitual', 400);
      }

      const user = employee.user
        ? await manager.getRepository(UserEntity).findOne({
            where: { id: employee.user.id },
            relations: {
              roles: true,
              company: true,
              employee: true
            }
          })
        : null;

      if (user) {
        if (dto.numero !== undefined) user.numero = dto.numero;
        if (dto.nombreEmpleado !== undefined) user.nombreEmpleado = dto.nombreEmpleado;
        if (dto.email !== undefined) user.email = dto.email;
        if (dto.dni !== undefined) user.dni = dto.dni;
        if (dto.diasVacaciones !== undefined) user.diasVacaciones = dto.diasVacaciones;
        if (dto.horasGeneradas !== undefined) user.horasGeneradas = dto.horasGeneradas;
        if (dto.working !== undefined) user.working = dto.working;
        if (dto.enVacaciones !== undefined) user.enVacaciones = dto.enVacaciones;
        if (dto.deBaja !== undefined) user.deBaja = dto.deBaja;
        user.company = company;
        await manager.getRepository(UserEntity).save(user);
      }

      const savedEmployee = await manager.getRepository(EmployeeEntity).save(employee);
      if (user) {
        user.employee = savedEmployee;
        await manager.getRepository(UserEntity).save(user);
      }

      return this.toDto(savedEmployee);
    });
  }

  async setActive(id: number, active: boolean, context: PrincipalTenantContext) {
    return this.update(id, { deBaja: !active }, context);
  }

  toDto(employee: EmployeeEntity): EmployeeResponseDto {
    return {
      id: employee.id,
      numero: employee.numero,
      nombreEmpleado: employee.nombreEmpleado,
      email: employee.email,
      dni: employee.dni,
      companyId: employee.company?.id ?? null,
      companyName: employee.company?.name ?? null,
      primaryWorkLocationId: employee.primaryWorkLocation?.id ?? null,
      primaryWorkLocationName: employee.primaryWorkLocation?.name ?? null,
      primaryWorkLocationCode: employee.primaryWorkLocation?.code ?? null,
      userId: employee.user?.id ?? null,
      diasVacaciones: employee.diasVacaciones ?? null,
      horasGeneradas: employee.horasGeneradas ?? null,
      working: employee.working ?? null,
      enVacaciones: employee.enVacaciones ?? null,
      deBaja: employee.deBaja ?? null,
      ultimoFichaje: employee.ultimoFichaje ?? null,
      roles: (employee.user?.roles ?? []).map((role) => role.rolNombre),
      active: !Boolean(employee.deBaja)
    };
  }

  private async resolveWorkLocation(
    manager: DataSource['manager'],
    workLocationId: number,
    companyId: number
  ) {
    const workLocation = await manager.getRepository(WorkLocationEntity).findOne({
      where: { id: workLocationId },
      relations: {
        company: true
      }
    });

    if (!workLocation) {
      throw new AppError('WORK_LOCATION_NOT_FOUND', 'Ubicación no encontrada', 404);
    }

    if (workLocation.company?.id !== companyId) {
      throw new AppError('WORK_LOCATION_COMPANY_MISMATCH', 'La ubicación no pertenece a la empresa', 400);
    }

    return workLocation;
  }
}
