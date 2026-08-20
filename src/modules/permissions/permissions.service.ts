import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { PermissionStatus } from '../../database/entities/permission-status.enum';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionMonthlyStatDto, PermissionUserStatDto } from './dto/permission-stats.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';

type PermissionListQuery = PaginationQueryDto & {
  search?: string;
  estado?: string;
  aprobado?: string;
  diaDesde?: string;
  diaHasta?: string;
  horaInicioDesde?: string;
  horaInicioHasta?: string;
  horaFinDesde?: string;
  horaFinHasta?: string;
  employeeId?: number;
  employeeNumero?: string;
  employeeNombre?: string;
  employeeDni?: string;
  employeeEmail?: string;
};

@Injectable()
export class PermissionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PermissionEntity)
    private readonly permissionsRepository: Repository<PermissionEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async create(dto: CreatePermissionDto, context: PrincipalTenantContext): Promise<PermissionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const employeeId = dto.employeeId ?? context.employeeId;
      if (!employeeId) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }

      if (dto.horaInicio > dto.horaFin) {
        throw new AppError('PERMISSION_INVALID_HOURS', 'La hora de fin debe ser posterior a la de inicio', 400);
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
        throw new AppError('FORBIDDEN', 'No puedes crear permisos para otro empleado', 403);
      }

      const company = await manager.getRepository(CompanyEntity).findOne({
        where: { id: employee.company.id }
      });

      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }

      const permission = manager.getRepository(PermissionEntity).create({
        dia: dto.dia,
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        descripcion: dto.descripcion,
        aprobado: false,
        estado: PermissionStatus.PENDIENTE,
        company,
        employee
      });

      const saved = await manager.getRepository(PermissionEntity).save(permission);
      return this.toDto(saved);
    });
  }

  async list(query: PermissionListQuery, context: PrincipalTenantContext) {
    return this.listInternal(query, context);
  }

  async listMine(query: PermissionListQuery, context: PrincipalTenantContext) {
    if (!context.employeeId) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }

    return this.listInternal({ ...query, employeeId: context.employeeId }, context);
  }

  async findByIdOrFail(id: number) {
    const permission = await this.permissionsRepository.findOne({
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

    if (!permission) {
      throw new AppError('PERMISSION_NOT_FOUND', 'Permiso no encontrado', 404);
    }

    return permission;
  }

  async getVisiblePermission(id: number, context: PrincipalTenantContext) {
    const permission = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(permission.company?.id, context, permission.employee?.user?.id);
    return this.toDto(permission);
  }

  async approve(id: number, context: PrincipalTenantContext) {
    const permission = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(permission.company?.id, context, permission.employee?.user?.id);
    permission.estado = PermissionStatus.APROBADO;
    permission.aprobado = true;
    return this.toDto(await this.permissionsRepository.save(permission));
  }

  async deny(id: number, context: PrincipalTenantContext) {
    const permission = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(permission.company?.id, context, permission.employee?.user?.id);
    permission.estado = PermissionStatus.DENEGADO;
    permission.aprobado = false;
    return this.toDto(await this.permissionsRepository.save(permission));
  }

  async delete(id: number, context: PrincipalTenantContext) {
    const permission = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(permission.company?.id, context, permission.employee?.user?.id);
    await this.permissionsRepository.remove(permission);
  }

  async countLast12Months(context: PrincipalTenantContext): Promise<PermissionMonthlyStatDto[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    const sinceIso = since.toISOString().slice(0, 10);

    const qb = this.permissionsRepository
      .createQueryBuilder('permission')
      .leftJoin('permission.company', 'company')
      .select("DATE_FORMAT(permission.dia, '%Y-%m')", 'month')
      .addSelect(
        'SUM(TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(permission.dia, \' \', permission.horaInicio), \'%Y-%m-%d %H:%i:%s\'), STR_TO_DATE(CONCAT(permission.dia, \' \', permission.horaFin), \'%Y-%m-%d %H:%i:%s\')))',
        'totalMinutes'
      )
      .where('permission.dia >= :since', { since: sinceIso })
      .andWhere('permission.estado = :estado', { estado: PermissionStatus.APROBADO });

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.groupBy('month').orderBy('month', 'ASC');
    const rows = await qb.getRawMany<{ month: string; totalMinutes: string | null }>();
    return rows.map((row) => ({
      month: row.month,
      totalMinutes: Number(row.totalMinutes ?? 0)
    }));
  }

  async countUsersLast12Months(context: PrincipalTenantContext): Promise<PermissionUserStatDto[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    const sinceIso = since.toISOString().slice(0, 10);

    const qb = this.permissionsRepository
      .createQueryBuilder('permission')
      .leftJoin('permission.company', 'company')
      .leftJoin('permission.employee', 'employee')
      .select('employee.id', 'employeeId')
      .addSelect('employee.numero', 'employeeNumero')
      .addSelect('employee.nombreEmpleado', 'employeeNombre')
      .addSelect(
        'SUM(TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(permission.dia, \' \', permission.horaInicio), \'%Y-%m-%d %H:%i:%s\'), STR_TO_DATE(CONCAT(permission.dia, \' \', permission.horaFin), \'%Y-%m-%d %H:%i:%s\')))',
        'totalMinutes'
      )
      .where('permission.dia >= :since', { since: sinceIso })
      .andWhere('permission.estado = :estado', { estado: PermissionStatus.APROBADO });

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.groupBy('employee.id').addGroupBy('employee.numero').addGroupBy('employee.nombreEmpleado').orderBy('totalMinutes', 'DESC');
    const rows = await qb.getRawMany<{
      employeeId: string | null;
      employeeNumero: string | null;
      employeeNombre: string | null;
      totalMinutes: string | null;
    }>();

    return rows.map((row) => ({
      employeeId: row.employeeId ? Number(row.employeeId) : null,
      employeeNumero: row.employeeNumero,
      employeeNombre: row.employeeNombre,
      totalMinutes: Number(row.totalMinutes ?? 0)
    }));
  }

  private async listInternal(query: PermissionListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.permissionsRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.company', 'company')
      .leftJoinAndSelect('permission.employee', 'employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('user.roles', 'role');

    if (query.search) {
      qb.andWhere(
        '(permission.descripcion LIKE :search OR employee.numero LIKE :search OR employee.nombreEmpleado LIKE :search OR employee.email LIKE :search OR employee.dni LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.estado) {
      qb.andWhere('permission.estado LIKE :estado', { estado: `%${query.estado}%` });
    }

    if (query.aprobado !== undefined) {
      const aprobado = query.aprobado === 'true' ? true : query.aprobado === 'false' ? false : null;
      if (aprobado !== null) {
        qb.andWhere('permission.aprobado = :aprobado', { aprobado });
      }
    }

    if (query.diaDesde) {
      qb.andWhere('permission.dia >= :diaDesde', { diaDesde: query.diaDesde });
    }

    if (query.diaHasta) {
      qb.andWhere('permission.dia <= :diaHasta', { diaHasta: query.diaHasta });
    }

    if (query.horaInicioDesde) {
      qb.andWhere('permission.horaInicio >= :horaInicioDesde', { horaInicioDesde: query.horaInicioDesde });
    }

    if (query.horaInicioHasta) {
      qb.andWhere('permission.horaInicio <= :horaInicioHasta', { horaInicioHasta: query.horaInicioHasta });
    }

    if (query.horaFinDesde) {
      qb.andWhere('permission.horaFin >= :horaFinDesde', { horaFinDesde: query.horaFinDesde });
    }

    if (query.horaFinHasta) {
      qb.andWhere('permission.horaFin <= :horaFinHasta', { horaFinHasta: query.horaFinHasta });
    }

    if (query.employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId: query.employeeId });
    }

    if (query.employeeNumero) {
      qb.andWhere('employee.numero LIKE :employeeNumero', { employeeNumero: `%${query.employeeNumero}%` });
    }

    if (query.employeeNombre) {
      qb.andWhere('employee.nombreEmpleado LIKE :employeeNombre', { employeeNombre: `%${query.employeeNombre}%` });
    }

    if (query.employeeDni) {
      qb.andWhere('employee.dni LIKE :employeeDni', { employeeDni: `%${query.employeeDni}%` });
    }

    if (query.employeeEmail) {
      qb.andWhere('employee.email LIKE :employeeEmail', { employeeEmail: `%${query.employeeEmail}%` });
    }

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.distinct(true);
    const allowedSortFields = new Set(['id', 'dia', 'horaInicio', 'horaFin', 'estado', 'aprobado']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`permission.${sortField}`, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [permissions, total] = await qb.getManyAndCount();
    return buildPaginatedResult(permissions.map((permission) => this.toDto(permission)), total, page, pageSize);
  }

  toDto(permission: PermissionEntity): PermissionResponseDto {
    return {
      id: permission.id,
      dia: permission.dia,
      horaInicio: permission.horaInicio,
      horaFin: permission.horaFin,
      descripcion: permission.descripcion,
      estado: permission.estado,
      aprobado: Boolean(permission.aprobado),
      companyId: permission.company?.id ?? null,
      companyName: permission.company?.name ?? null,
      employeeId: permission.employee?.id ?? null,
      employeeNumero: permission.employee?.numero ?? null,
      employeeNombre: permission.employee?.nombreEmpleado ?? null,
      employeeEmail: permission.employee?.email ?? null,
      employeeDni: permission.employee?.dni ?? null
    };
  }
}
