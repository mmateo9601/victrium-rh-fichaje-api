import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentResponseDto } from './dto/incident-response.dto';
import { IncidentMonthlyStatDto, IncidentTopSummaryDto, IncidentUserStatDto } from './dto/incident-stats.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

type IncidentListQuery = PaginationQueryDto & {
  search?: string;
  resuelta?: string;
  diaDesde?: string;
  diaHasta?: string;
  employeeId?: number;
};

@Injectable()
export class IncidentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(IncidentEntity)
    private readonly incidentsRepository: Repository<IncidentEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async create(dto: CreateIncidentDto, context: PrincipalTenantContext): Promise<IncidentResponseDto> {
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
        throw new AppError('FORBIDDEN', 'No puedes crear incidencias para otro empleado', 403);
      }

      const company = await manager.getRepository(CompanyEntity).findOne({ where: { id: employee.company.id } });
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }

      const incident = manager.getRepository(IncidentEntity).create({
        descripcion: dto.descripcion,
        resumen: dto.resumen,
        dia: dto.dia,
        explicacion: dto.explicacion ?? null,
        resuelta: false,
        company,
        employee
      });

      const saved = await manager.getRepository(IncidentEntity).save(incident);
      return this.toDto(saved);
    });
  }

  async list(query: IncidentListQuery, context: PrincipalTenantContext) {
    return this.listInternal(query, context);
  }

  async listMine(query: IncidentListQuery, context: PrincipalTenantContext) {
    if (!context.employeeId) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }

    return this.listInternal({ ...query, employeeId: context.employeeId }, context);
  }

  async findByIdOrFail(id: number) {
    const incident = await this.incidentsRepository.findOne({
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

    if (!incident) {
      throw new AppError('INCIDENT_NOT_FOUND', 'Incidencia no encontrada', 404);
    }

    return incident;
  }

  async getVisibleIncident(id: number, context: PrincipalTenantContext) {
    const incident = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(incident.company?.id, context, incident.employee?.user?.id);
    return this.toDto(incident);
  }

  async update(id: number, dto: UpdateIncidentDto, context: PrincipalTenantContext) {
    return this.dataSource.transaction(async (manager) => {
      const incident = await manager.getRepository(IncidentEntity).findOne({
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

      if (!incident) {
        throw new AppError('INCIDENT_NOT_FOUND', 'Incidencia no encontrada', 404);
      }

      this.tenantScope.assertResourceAccess(incident.company?.id, context, incident.employee?.user?.id);

      if (!context.canAccessAll && incident.employee?.user?.id !== context.userId) {
        throw new AppError('FORBIDDEN', 'No puedes editar incidencias de otro empleado', 403);
      }

      if (dto.descripcion !== undefined) incident.descripcion = dto.descripcion;
      if (dto.resumen !== undefined) incident.resumen = dto.resumen;
      if (dto.dia !== undefined) incident.dia = dto.dia;
      if (dto.explicacion !== undefined) incident.explicacion = dto.explicacion;
      if (dto.resuelta !== undefined) incident.resuelta = dto.resuelta;

      const saved = await manager.getRepository(IncidentEntity).save(incident);
      return this.toDto(saved);
    });
  }

  async markResolved(id: number, context: PrincipalTenantContext) {
    return this.update(id, { resuelta: true }, context);
  }

  async countLast12Months(context: PrincipalTenantContext): Promise<IncidentMonthlyStatDto[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    const sinceIso = since.toISOString().slice(0, 10);

    const qb = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoin('incident.company', 'company')
      .select("DATE_FORMAT(incident.dia, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'total')
      .where('incident.dia >= :since', { since: sinceIso });

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.groupBy('month').orderBy('month', 'ASC');
    const rows = (await qb.getRawMany<{ month: string; total: string }>()).map((row) => ({
      month: row.month,
      total: Number(row.total)
    }));
    return rows;
  }

  async countUsersLast12Months(context: PrincipalTenantContext): Promise<IncidentUserStatDto[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    const sinceIso = since.toISOString().slice(0, 10);

    const qb = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoin('incident.company', 'company')
      .leftJoin('incident.employee', 'employee')
      .select('employee.id', 'employeeId')
      .addSelect('employee.numero', 'employeeNumero')
      .addSelect('employee.nombreEmpleado', 'employeeNombre')
      .addSelect('COUNT(*)', 'total')
      .where('incident.dia >= :since', { since: sinceIso });

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.groupBy('employee.id').addGroupBy('employee.numero').addGroupBy('employee.nombreEmpleado').orderBy('total', 'DESC');
    const rows = await qb.getRawMany<{ employeeId: string | null; employeeNumero: string | null; employeeNombre: string | null; total: string }>();
    return rows.map((row) => ({
      employeeId: row.employeeId ? Number(row.employeeId) : null,
      employeeNumero: row.employeeNumero,
      employeeNombre: row.employeeNombre,
      total: Number(row.total)
    }));
  }

  async topIncidenciasLast12Months(context: PrincipalTenantContext): Promise<IncidentTopSummaryDto[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    const sinceIso = since.toISOString().slice(0, 10);

    const qb = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoin('incident.company', 'company')
      .select('incident.resumen', 'resumen')
      .addSelect('COUNT(*)', 'total')
      .where('incident.dia >= :since', { since: sinceIso });

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.groupBy('incident.resumen').orderBy('total', 'DESC').take(10);
    const rows = await qb.getRawMany<{ resumen: string; total: string }>();
    return rows.map((row) => ({
      resumen: row.resumen,
      total: Number(row.total)
    }));
  }

  private async listInternal(query: IncidentListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.company', 'company')
      .leftJoinAndSelect('incident.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('user.roles', 'role');

    if (query.search) {
      qb.andWhere(
        '(incident.descripcion LIKE :search OR incident.resumen LIKE :search OR incident.explicacion LIKE :search OR employee.numero LIKE :search OR employee.nombreEmpleado LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.resuelta !== undefined) {
      const resuelta = query.resuelta === 'true' ? true : query.resuelta === 'false' ? false : null;
      if (resuelta !== null) {
        qb.andWhere('incident.resuelta = :resuelta', { resuelta });
      }
    }

    if (query.diaDesde) {
      qb.andWhere('incident.dia >= :diaDesde', { diaDesde: query.diaDesde });
    }

    if (query.diaHasta) {
      qb.andWhere('incident.dia <= :diaHasta', { diaHasta: query.diaHasta });
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
    const allowedSortFields = new Set(['id', 'dia', 'resuelta', 'resumen']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`incident.${sortField}`, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [incidents, total] = await qb.getManyAndCount();
    return buildPaginatedResult(incidents.map((incident) => this.toDto(incident)), total, page, pageSize);
  }

  toDto(incident: IncidentEntity): IncidentResponseDto {
    return {
      id: incident.id,
      descripcion: incident.descripcion,
      resumen: incident.resumen,
      dia: incident.dia,
      resuelta: Boolean(incident.resuelta),
      explicacion: incident.explicacion ?? null,
      companyId: incident.company?.id ?? null,
      companyName: incident.company?.name ?? null,
      employeeId: incident.employee?.id ?? null,
      employeeNumero: incident.employee?.numero ?? null,
      employeeNombre: incident.employee?.nombreEmpleado ?? null
    };
  }
}
