import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { VacationStatus } from '../../database/entities/vacation-status.enum';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { VacationResponseDto } from './dto/vacation-response.dto';

type VacationListQuery = PaginationQueryDto & {
  search?: string;
  estado?: string;
  consumidas?: string;
  aprobado?: string;
  inicioDesde?: string;
  inicioHasta?: string;
  finDesde?: string;
  finHasta?: string;
  employeeId?: number;
};

@Injectable()
export class VacationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(VacationEntity)
    private readonly vacationsRepository: Repository<VacationEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async create(dto: CreateVacationDto, context: PrincipalTenantContext): Promise<VacationResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const employeeId = dto.employeeId ?? context.employeeId;
      if (!employeeId) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }

      const employee = await manager.getRepository(EmployeeEntity).findOne({
        where: { id: employeeId },
        relations: {
          company: true,
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

      if (!context.canAccessAll && employee.user?.id !== context.userId) {
        throw new AppError('FORBIDDEN', 'No puedes crear vacaciones para otro empleado', 403);
      }

      if (dto.inicio > dto.fin) {
        throw new AppError('VACATION_INVALID_DATES', 'La fecha de fin debe ser posterior a la de inicio', 400);
      }

      const company = await manager.getRepository(CompanyEntity).findOne({
        where: { id: employee.company.id }
      });

      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }

      const vacation = manager.getRepository(VacationEntity).create({
        inicio: dto.inicio,
        fin: dto.fin,
        consumidas: false,
        aprobado: false,
        estado: VacationStatus.PENDIENTE,
        company,
        employee
      });

      const savedVacation = await manager.getRepository(VacationEntity).save(vacation);
      return this.toDto(savedVacation);
    });
  }

  async list(query: VacationListQuery, context: PrincipalTenantContext) {
    return this.listInternal(query, context);
  }

  async listMine(query: VacationListQuery, context: PrincipalTenantContext) {
    if (!context.employeeId) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }

    return this.listInternal({ ...query, employeeId: context.employeeId }, context);
  }

  async findByIdOrFail(id: number) {
    const vacation = await this.vacationsRepository.findOne({
      where: { id },
      relations: {
        company: true,
        employee: {
          company: true,
          user: {
            roles: true,
            company: true
          }
        }
      }
    });

    if (!vacation) {
      throw new AppError('VACATION_NOT_FOUND', 'Vacación no encontrada', 404);
    }

    return vacation;
  }

  async getVisibleVacation(id: number, context: PrincipalTenantContext) {
    const vacation = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(vacation.company?.id, context, vacation.employee?.user?.id);
    return this.toDto(vacation);
  }

  async approve(id: number, context: PrincipalTenantContext) {
    const vacation = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(vacation.company?.id, context);
    vacation.estado = VacationStatus.APROBADO;
    vacation.aprobado = true;
    return this.toDto(await this.vacationsRepository.save(vacation));
  }

  async deny(id: number, context: PrincipalTenantContext) {
    const vacation = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(vacation.company?.id, context);
    vacation.estado = VacationStatus.DENEGADO;
    vacation.aprobado = false;
    return this.toDto(await this.vacationsRepository.save(vacation));
  }

  private async listInternal(query: VacationListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.vacationsRepository
      .createQueryBuilder('vacation')
      .leftJoinAndSelect('vacation.company', 'company')
      .leftJoinAndSelect('vacation.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('user.roles', 'role');

    if (query.search) {
      qb.andWhere(
        '(employee.numero LIKE :search OR employee.nombreEmpleado LIKE :search OR employee.email LIKE :search OR employee.dni LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.estado) {
      qb.andWhere('vacation.estado LIKE :estado', { estado: `%${query.estado}%` });
    }

    if (query.consumidas !== undefined) {
      const consumidas = query.consumidas === 'true' ? true : query.consumidas === 'false' ? false : null;
      if (consumidas !== null) {
        qb.andWhere('vacation.consumidas = :consumidas', { consumidas });
      }
    }

    if (query.aprobado !== undefined) {
      const aprobado = query.aprobado === 'true' ? true : query.aprobado === 'false' ? false : null;
      if (aprobado !== null) {
        qb.andWhere('vacation.aprobado = :aprobado', { aprobado });
      }
    }

    if (query.inicioDesde) {
      qb.andWhere('vacation.inicio >= :inicioDesde', { inicioDesde: query.inicioDesde });
    }

    if (query.inicioHasta) {
      qb.andWhere('vacation.inicio <= :inicioHasta', { inicioHasta: query.inicioHasta });
    }

    if (query.finDesde) {
      qb.andWhere('vacation.fin >= :finDesde', { finDesde: query.finDesde });
    }

    if (query.finHasta) {
      qb.andWhere('vacation.fin <= :finHasta', { finHasta: query.finHasta });
    }

    if (query.employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId: query.employeeId });
    }

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.distinct(true);
    const allowedSortFields = new Set(['id', 'inicio', 'fin', 'consumidas', 'estado', 'aprobado']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`vacation.${sortField}`, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [vacations, total] = await qb.getManyAndCount();
    return buildPaginatedResult(vacations.map((vacation) => this.toDto(vacation)), total, page, pageSize);
  }

  toDto(vacation: VacationEntity): VacationResponseDto {
    return {
      id: vacation.id,
      inicio: vacation.inicio,
      fin: vacation.fin,
      consumidas: Boolean(vacation.consumidas),
      estado: vacation.estado,
      aprobado: Boolean(vacation.aprobado),
      companyId: vacation.company?.id ?? null,
      companyName: vacation.company?.name ?? null,
      employeeId: vacation.employee?.id ?? null,
      employeeNumero: vacation.employee?.numero ?? null,
      employeeNombre: vacation.employee?.nombreEmpleado ?? null
    };
  }
}
