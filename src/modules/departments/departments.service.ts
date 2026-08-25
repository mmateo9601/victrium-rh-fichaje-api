import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { DepartmentEntity } from '../../database/entities/department.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { CreateDepartmentDto, DepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepository: Repository<DepartmentEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async list(query: Partial<PaginationQueryDto> & { search?: string; active?: string; companyId?: number }, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.departmentsRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.company', 'company')
      .leftJoinAndSelect('department.parentDepartment', 'parentDepartment')
      .leftJoinAndSelect('department.manager', 'manager');

    if (query.search) {
      qb.andWhere('(department.name LIKE :search OR department.code LIKE :search OR department.description LIKE :search)', {
        search: `%${query.search}%`
      });
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('department.active = :active', { active });
      }
    }

    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'department', context);
    qb.orderBy('department.active', 'DESC').addOrderBy('department.name', 'ASC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items.map((item) => this.toDto(item)), total, page, pageSize);
  }

  async get(id: number, context: PrincipalTenantContext) {
    const department = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(department.company?.id, context);
    return this.toDto(department);
  }

  async create(dto: CreateDepartmentDto, context: PrincipalTenantContext) {
    const company = await this.resolveCompany(dto.companyId ?? context.companyId, context);
    const parentDepartment = await this.resolveParentDepartment(dto.parentDepartmentId ?? null, company.id, context);
    const manager = await this.resolveManager(dto.managerEmployeeId ?? null, company.id, context);

    await this.ensureUnique(company.id, dto.name, dto.code);

    const department = await this.departmentsRepository.save(
      this.departmentsRepository.create({
        company,
        name: dto.name,
        code: dto.code,
        parentDepartment,
        manager,
        description: dto.description ?? null,
        active: dto.active ?? true,
        notes: dto.notes ?? null,
        metadata: dto.metadata ?? null
      })
    );

    return this.toDto(
      (await this.departmentsRepository.findOne({
        where: { id: department.id },
        relations: { company: true, parentDepartment: true, manager: true }
      })) ?? department
    );
  }

  async update(id: number, dto: UpdateDepartmentDto, context: PrincipalTenantContext) {
    const department = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(department.company?.id, context);

    const nextCompany = dto.companyId !== undefined ? await this.resolveCompany(dto.companyId, context) : department.company;
    const nextParentDepartment =
      dto.parentDepartmentId !== undefined
        ? await this.resolveParentDepartment(dto.parentDepartmentId, nextCompany.id, context)
        : department.parentDepartment ?? null;
    const nextManager =
      dto.managerEmployeeId !== undefined
        ? await this.resolveManager(dto.managerEmployeeId, nextCompany.id, context)
        : department.manager ?? null;

    if (dto.name !== undefined || dto.code !== undefined || nextCompany.id !== department.company?.id) {
      await this.ensureUnique(nextCompany.id, dto.name ?? department.name, dto.code ?? department.code, department.id);
    }

    department.company = nextCompany;
    if (dto.name !== undefined) department.name = dto.name;
    if (dto.code !== undefined) department.code = dto.code;
    if (dto.description !== undefined) department.description = dto.description;
    if (dto.active !== undefined) department.active = dto.active;
    if (dto.notes !== undefined) department.notes = dto.notes;
    if (dto.metadata !== undefined) department.metadata = dto.metadata;
    department.parentDepartment = nextParentDepartment;
    department.manager = nextManager;

    const saved = await this.departmentsRepository.save(department);
    return this.toDto(
      (await this.departmentsRepository.findOne({
        where: { id: saved.id },
        relations: { company: true, parentDepartment: true, manager: true }
      })) ?? saved
    );
  }

  async activate(id: number, context: PrincipalTenantContext) {
    return this.update(id, { active: true }, context);
  }

  async deactivate(id: number, context: PrincipalTenantContext) {
    return this.update(id, { active: false }, context);
  }

  async delete(id: number, context: PrincipalTenantContext) {
    const department = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(department.company?.id, context);
    await this.departmentsRepository.remove(department);
    return { message: 'Departamento eliminado' };
  }

  private async findByIdOrFail(id: number) {
    const department = await this.departmentsRepository.findOne({
      where: { id },
      relations: { company: true, parentDepartment: true, manager: true }
    });
    if (!department) {
      throw new AppError('DEPARTMENT_NOT_FOUND', 'Departamento no encontrado', 404);
    }
    return department;
  }

  private async resolveCompany(companyId: number | null | undefined, context: PrincipalTenantContext) {
    if (companyId === null || companyId === undefined) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    this.tenantScope.assertResourceAccess(company.id, context);
    return company;
  }

  private async resolveParentDepartment(parentDepartmentId: number | null, companyId: number, context: PrincipalTenantContext) {
    if (parentDepartmentId === null) return null;
    const parent = await this.departmentsRepository.findOne({ where: { id: parentDepartmentId }, relations: { company: true } });
    if (!parent) {
      throw new AppError('DEPARTMENT_NOT_FOUND', 'Departamento no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(parent.company?.id, context);
    if (parent.company?.id !== companyId) {
      throw new AppError('DEPARTMENT_COMPANY_MISMATCH', 'El departamento padre pertenece a otra empresa', 400);
    }
    return parent;
  }

  private async resolveManager(managerEmployeeId: number | null, companyId: number, context: PrincipalTenantContext) {
    if (managerEmployeeId === null) return null;
    const employee = await this.employeesRepository.findOne({ where: { id: managerEmployeeId }, relations: { company: true } });
    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);
    if (employee.company?.id !== companyId) {
      throw new AppError('DEPARTMENT_COMPANY_MISMATCH', 'El responsable pertenece a otra empresa', 400);
    }
    return employee;
  }

  private async ensureUnique(companyId: number, name: string, code: string, excludeId?: number) {
    const qb = this.departmentsRepository
      .createQueryBuilder('department')
      .leftJoin('department.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('(department.name = :name OR department.code = :code)', { name, code });
    if (excludeId !== undefined) {
      qb.andWhere('department.id <> :excludeId', { excludeId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new AppError('DEPARTMENT_ALREADY_EXISTS', 'Ya existe un departamento con ese nombre o código', 409);
    }
  }

  private toDto(department: DepartmentEntity): DepartmentDto {
    return {
      id: department.id,
      companyId: department.company?.id ?? null,
      companyName: department.company?.name ?? null,
      parentDepartmentId: department.parentDepartment?.id ?? null,
      parentDepartmentName: department.parentDepartment?.name ?? null,
      managerEmployeeId: department.manager?.id ?? null,
      managerEmployeeNombre: department.manager?.nombreEmpleado ?? null,
      name: department.name,
      code: department.code,
      description: department.description ?? null,
      active: department.active,
      notes: department.notes ?? null,
      metadata: department.metadata ?? null,
      createdAt: department.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: department.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
