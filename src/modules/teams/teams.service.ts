import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { DepartmentEntity } from '../../database/entities/department.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { TeamEntity } from '../../database/entities/team.entity';
import { CreateTeamDto, TeamDto, UpdateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepository: Repository<DepartmentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async list(query: Partial<PaginationQueryDto> & { search?: string; active?: string; companyId?: number }, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.teamsRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.company', 'company')
      .leftJoinAndSelect('team.department', 'department')
      .leftJoinAndSelect('team.manager', 'manager');

    if (query.search) {
      qb.andWhere('(team.name LIKE :search OR team.code LIKE :search OR team.notes LIKE :search)', { search: `%${query.search}%` });
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) qb.andWhere('team.active = :active', { active });
    }

    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'team', context);
    qb.orderBy('team.active', 'DESC').addOrderBy('team.name', 'ASC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items.map((item) => this.toDto(item)), total, page, pageSize);
  }

  async get(id: number, context: PrincipalTenantContext) {
    const team = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(team.company?.id, context);
    return this.toDto(team);
  }

  async create(dto: CreateTeamDto, context: PrincipalTenantContext) {
    const company = await this.resolveCompany(dto.companyId ?? context.companyId, context);
    const department = await this.resolveDepartment(dto.departmentId ?? null, company.id, context);
    const manager = await this.resolveManager(dto.managerEmployeeId ?? null, company.id, context);
    await this.ensureUnique(company.id, dto.name, dto.code ?? null);

    const team = await this.teamsRepository.save(
      this.teamsRepository.create({
        company,
        department,
        name: dto.name,
        code: dto.code ?? null,
        manager,
        active: dto.active ?? true,
        notes: dto.notes ?? null,
        metadata: dto.metadata ?? null
      })
    );

    return this.toDto(
      (await this.teamsRepository.findOne({
        where: { id: team.id },
        relations: { company: true, department: true, manager: true }
      })) ?? team
    );
  }

  async update(id: number, dto: UpdateTeamDto, context: PrincipalTenantContext) {
    const team = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(team.company?.id, context);
    const nextCompany = dto.companyId !== undefined ? await this.resolveCompany(dto.companyId, context) : team.company;
    const nextDepartment =
      dto.departmentId !== undefined ? await this.resolveDepartment(dto.departmentId, nextCompany.id, context) : team.department ?? null;
    const nextManager =
      dto.managerEmployeeId !== undefined ? await this.resolveManager(dto.managerEmployeeId, nextCompany.id, context) : team.manager ?? null;

    if (dto.name !== undefined || dto.code !== undefined || nextCompany.id !== team.company?.id) {
      await this.ensureUnique(nextCompany.id, dto.name ?? team.name, dto.code ?? team.code ?? null, team.id);
    }

    team.company = nextCompany;
    team.department = nextDepartment;
    if (dto.name !== undefined) team.name = dto.name;
    if (dto.code !== undefined) team.code = dto.code;
    if (dto.managerEmployeeId !== undefined) team.manager = nextManager;
    if (dto.active !== undefined) team.active = dto.active;
    if (dto.notes !== undefined) team.notes = dto.notes;
    if (dto.metadata !== undefined) team.metadata = dto.metadata;

    const saved = await this.teamsRepository.save(team);
    return this.toDto(
      (await this.teamsRepository.findOne({
        where: { id: saved.id },
        relations: { company: true, department: true, manager: true }
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
    const team = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(team.company?.id, context);
    await this.teamsRepository.remove(team);
    return { message: 'Equipo eliminado' };
  }

  private async findByIdOrFail(id: number) {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: { company: true, department: true, manager: true }
    });
    if (!team) throw new AppError('TEAM_NOT_FOUND', 'Equipo no encontrado', 404);
    return team;
  }

  private async resolveCompany(companyId: number | null | undefined, context: PrincipalTenantContext) {
    if (companyId === null || companyId === undefined) throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    this.tenantScope.assertResourceAccess(company.id, context);
    return company;
  }

  private async resolveDepartment(departmentId: number | null, companyId: number, context: PrincipalTenantContext) {
    if (departmentId === null) return null;
    const department = await this.departmentsRepository.findOne({ where: { id: departmentId }, relations: { company: true } });
    if (!department) throw new AppError('DEPARTMENT_NOT_FOUND', 'Departamento no encontrado', 404);
    this.tenantScope.assertResourceAccess(department.company?.id, context);
    if (department.company?.id !== companyId) {
      throw new AppError('TEAM_COMPANY_MISMATCH', 'El departamento pertenece a otra empresa', 400);
    }
    return department;
  }

  private async resolveManager(managerEmployeeId: number | null, companyId: number, context: PrincipalTenantContext) {
    if (managerEmployeeId === null) return null;
    const employee = await this.employeesRepository.findOne({ where: { id: managerEmployeeId }, relations: { company: true } });
    if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);
    if (employee.company?.id !== companyId) {
      throw new AppError('TEAM_COMPANY_MISMATCH', 'El responsable pertenece a otra empresa', 400);
    }
    return employee;
  }

  private async ensureUnique(companyId: number, name: string, code: string | null, excludeId?: number) {
    const qb = this.teamsRepository.createQueryBuilder('team').leftJoin('team.company', 'company').where('company.id = :companyId', { companyId });
    qb.andWhere('(team.name = :name OR (:code IS NOT NULL AND team.code = :code))', { name, code });
    if (excludeId !== undefined) qb.andWhere('team.id <> :excludeId', { excludeId });
    const existing = await qb.getOne();
    if (existing) throw new AppError('TEAM_ALREADY_EXISTS', 'Ya existe un equipo con ese nombre o código', 409);
  }

  private toDto(team: TeamEntity): TeamDto {
    return {
      id: team.id,
      companyId: team.company?.id ?? null,
      companyName: team.company?.name ?? null,
      departmentId: team.department?.id ?? null,
      departmentName: team.department?.name ?? null,
      managerEmployeeId: team.manager?.id ?? null,
      managerEmployeeNombre: team.manager?.nombreEmpleado ?? null,
      name: team.name,
      code: team.code ?? null,
      active: team.active,
      notes: team.notes ?? null,
      metadata: team.metadata ?? null,
      createdAt: team.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: team.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
