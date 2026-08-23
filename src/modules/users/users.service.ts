import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Brackets, DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { CONTRACT_ROLES, normalizeRoleNames } from '../../common/auth/role-access';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { AuthSessionEntity } from '../../database/entities/auth-session.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RoleName } from '../../database/entities/role-name.enum';
import { RoleEntity } from '../../database/entities/role.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PublicUserDto } from './dto/public-user.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

type UsersListQuery = PaginationQueryDto & {
  search?: string;
  role?: RoleName | string;
  active?: string | boolean;
  companyId?: number;
  employeeId?: number;
};

function isTruthy(value: unknown) {
  return value === true || value === 'true';
}

@Injectable()
export class UsersService {
  private lastLoginAtColumnExistsPromise?: Promise<boolean>;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async findByNumero(numero: string) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .where('user.numero = :numero', { numero });
    await this.addLastLoginAtSelectIfAvailable(qb);
    return qb.getOne();
  }

  async findByNumeroOrEmail(identifier: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .where('user.numero = :identifier', { identifier })
      .orWhere('LOWER(user.email) = :normalizedIdentifier', { normalizedIdentifier });
    await this.addLastLoginAtSelectIfAvailable(qb);
    return qb.getOne();
  }

  async findById(id: number) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .where('user.id = :id', { id });
    await this.addLastLoginAtSelectIfAvailable(qb);
    return qb.getOne();
  }

  async findByNumeroOrFail(numero: string) {
    const user = await this.findByNumero(numero);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    return user;
  }

  async findByNumeroOrEmailOrFail(identifier: string) {
    const user = await this.findByNumeroOrEmail(identifier);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    return user;
  }

  async findByEmailOrFail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    return user;
  }

  async findByIdOrFail(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    return user;
  }

  toPublicUser(user: UserEntity): PublicUserDto {
    const company = user.company ?? user.employee?.company ?? null;
    return {
      id: user.id,
      email: user.email,
      numero: user.numero,
      nombreEmpleado: user.nombreEmpleado,
      companyId: company?.id ?? null,
      employeeId: user.employee?.id ?? null,
      companyName: company?.name ?? null,
      employeeName: user.employee?.nombreEmpleado ?? null,
      roles: normalizeRoleNames((user.roles ?? []).map((role) => role.rolNombre)),
      admin: Boolean(user.admin),
      active: !Boolean(user.deBaja),
      lastLoginAt: user.lastLoginAt?.toISOString?.() ?? null
    };
  }

  isRrhhOrAdmin(user: UserEntity) {
    const roles = normalizeRoleNames((user.roles ?? []).map((role) => role.rolNombre));
    return roles.includes(RoleName.ROLE_SUPER_ADMIN) || roles.includes(RoleName.ROLE_COMPANY_ADMIN) || roles.includes(RoleName.ROLE_RRHH) || Boolean(user.admin);
  }

  async list(query: UsersListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany');
    await this.addLastLoginAtSelectIfAvailable(qb);

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.email) LIKE LOWER(:search) OR user.numero LIKE :search OR user.nombreEmpleado LIKE :search OR user.dni LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.role) {
      qb.andWhere('role.rolNombre = :role', { role: query.role });
    }

    if (query.employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId: query.employeeId });
    }

    if (query.companyId) {
      qb.andWhere('(company.id = :companyId OR employeeCompany.id = :companyId)', { companyId: query.companyId });
    }

    if (query.active !== undefined) {
      const active = isTruthy(query.active);
      if (query.active === true || query.active === false || query.active === 'true' || query.active === 'false') {
        qb.andWhere('user.deBaja = :deBaja', { deBaja: !active });
      }
    }

    this.tenantScope.applyCompanyScope(qb, 'user', context, {
      selfAlias: 'user',
      selfId: context.userId
    });

    qb.distinct(true);

    const allowedSortFields = new Set(['id', 'numero', 'nombreEmpleado', 'email', 'dni', 'deBaja', 'lastLoginAt']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`user.${sortField}`, (query.order ?? 'asc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [users, total] = await qb.getManyAndCount();

    return buildPaginatedResult(users.map((user) => this.toPublicUser(user)), total, page, pageSize);
  }

  async listByCompany(companyId: number, query: UsersListQuery) {
    return this.list(query, {
      userId: 0,
      companyId,
      employeeId: null,
      roles: [],
      canAccessAll: false
    });
  }

  async requireTenantAccess(user: UserEntity, context: PrincipalTenantContext) {
    this.tenantScope.assertResourceAccess(user.company?.id ?? user.employee?.company?.id, context, user.id);
    return user;
  }

  async create(dto: CreateUserAdminDto, context: PrincipalTenantContext): Promise<PublicUserDto> {
    return this.dataSource.transaction(async (manager) => {
      const assignableRoleNames = this.resolveRoleNames(dto.roles, context);
      const assignableRoles = await this.loadRoleEntities(manager, assignableRoleNames);
      const employee = dto.employeeId !== undefined && dto.employeeId !== null ? await this.findEmployee(manager, dto.employeeId) : null;
      const company = await this.resolveCompany(manager, dto.companyId ?? employee?.company?.id ?? null, context);

      if (!context.canAccessAll && dto.companyId !== undefined && dto.companyId !== context.companyId) {
        throw new AppError('FORBIDDEN_CROSS_TENANT', 'No puedes crear usuarios fuera de tu empresa', 403);
      }

      if (company && employee && employee.company?.id !== company.id) {
        throw new AppError('USER_EMPLOYEE_COMPANY_MISMATCH', 'El empleado no pertenece a la empresa seleccionada', 400);
      }

      if (!company && (assignableRoleNames.some((role) => role !== RoleName.ROLE_SUPER_ADMIN) || employee)) {
        throw new AppError('COMPANY_NOT_FOUND', 'La empresa es obligatoria para este usuario', 400);
      }

      if (assignableRoleNames.includes(RoleName.ROLE_USER) && !employee) {
        throw new AppError('EMPLOYEE_REQUIRED', 'El rol USER requiere vincular un empleado', 400);
      }

      if (employee?.user) {
        throw new AppError('EMPLOYEE_ALREADY_LINKED', 'El empleado ya tiene un usuario vinculado', 409);
      }

      await this.ensureUserUniqueness(manager, dto.email, dto.numero, dto.dni);
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const userRepository = manager.getRepository(UserEntity);
      const user = userRepository.create({
        email: dto.email.trim().toLowerCase(),
        password: passwordHash,
        numero: dto.numero,
        nombreEmpleado: dto.nombreEmpleado,
        dni: dto.dni,
        company,
        employee: employee ?? null,
        deBaja: dto.active === undefined ? false : !dto.active,
        admin: assignableRoleNames.includes(RoleName.ROLE_SUPER_ADMIN) || assignableRoleNames.includes(RoleName.ROLE_COMPANY_ADMIN),
        roles: assignableRoles
      });

      const saved = await userRepository.save(user);

      if (employee) {
        employee.user = saved;
        employee.company = company ?? employee.company;
        await manager.getRepository(EmployeeEntity).save(employee);
      }

      const reloaded = await userRepository.findOne({
        where: { id: saved.id },
        relations: { roles: true, company: true, employee: { company: true } }
      });
      if (!reloaded) {
        throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
      }

      return this.toPublicUser(reloaded);
    });
  }

  async update(id: number, dto: UpdateUserAdminDto, context: PrincipalTenantContext): Promise<PublicUserDto> {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const user = await userRepository.findOne({
        where: { id },
        relations: { roles: true, company: true, employee: { company: true, user: true } }
      });

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
      }

      this.tenantScope.assertResourceAccess(user.company?.id ?? user.employee?.company?.id, context, user.id);

      const nextRoleNames = dto.roles ? this.resolveRoleNames(dto.roles, context) : normalizeRoleNames(user.roles.map((role) => role.rolNombre));
      const nextRoles = dto.roles ? await this.loadRoleEntities(manager, nextRoleNames) : user.roles;
      const nextEmployee =
        dto.employeeId === undefined
          ? user.employee ?? null
          : dto.employeeId === null
            ? null
            : await this.findEmployee(manager, dto.employeeId);
      const nextCompany = await this.resolveCompany(manager, dto.companyId ?? user.company?.id ?? nextEmployee?.company?.id ?? null, context);

      if (!context.canAccessAll && dto.companyId !== undefined && dto.companyId !== context.companyId) {
        throw new AppError('FORBIDDEN_CROSS_TENANT', 'No puedes mover usuarios a otra empresa', 403);
      }

      if (nextCompany && nextEmployee && nextEmployee.company?.id !== nextCompany.id) {
        throw new AppError('USER_EMPLOYEE_COMPANY_MISMATCH', 'El empleado no pertenece a la empresa seleccionada', 400);
      }

      if (!nextCompany && nextRoleNames.some((role) => role !== RoleName.ROLE_SUPER_ADMIN)) {
        throw new AppError('COMPANY_NOT_FOUND', 'La empresa es obligatoria para este usuario', 400);
      }

      if (nextRoleNames.includes(RoleName.ROLE_USER) && !nextEmployee) {
        throw new AppError('EMPLOYEE_REQUIRED', 'El rol USER requiere vincular un empleado', 400);
      }

      if (nextEmployee?.user && nextEmployee.user.id !== user.id) {
        throw new AppError('EMPLOYEE_ALREADY_LINKED', 'El empleado ya tiene un usuario vinculado', 409);
      }

      if (dto.email !== undefined) user.email = dto.email.trim().toLowerCase();
      if (dto.numero !== undefined) user.numero = dto.numero;
      if (dto.nombreEmpleado !== undefined) user.nombreEmpleado = dto.nombreEmpleado;
      if (dto.dni !== undefined) user.dni = dto.dni;
      if (dto.password !== undefined) user.password = await bcrypt.hash(dto.password, 10);
      if (dto.active !== undefined) user.deBaja = !dto.active;
      if (dto.companyId !== undefined) user.company = nextCompany;
      if (dto.roles !== undefined) user.roles = nextRoles;

      await this.ensureUserUniqueness(manager, user.email, user.numero, user.dni, user.id);

      if (user.employee && (!nextEmployee || nextEmployee.id !== user.employee.id)) {
        const previousEmployee = await manager.getRepository(EmployeeEntity).findOne({
          where: { id: user.employee.id },
          relations: { company: true, user: true }
        });
        if (previousEmployee) {
          previousEmployee.user = null;
          await manager.getRepository(EmployeeEntity).save(previousEmployee);
        }
      }

      if (nextEmployee) {
        nextEmployee.user = user;
        nextEmployee.company = nextCompany ?? nextEmployee.company;
        await manager.getRepository(EmployeeEntity).save(nextEmployee);
        user.employee = nextEmployee;
        user.company = nextCompany ?? nextEmployee.company;
      } else if (dto.employeeId === null) {
        user.employee = null;
      }

      if (nextCompany && user.employee && user.employee.company?.id !== nextCompany.id) {
        throw new AppError('USER_EMPLOYEE_COMPANY_MISMATCH', 'El empleado no pertenece a la empresa seleccionada', 400);
      }

      const saved = await userRepository.save(user);

      if (dto.active === false) {
        await manager
          .getRepository(AuthSessionEntity)
          .createQueryBuilder()
          .update()
          .set({ revokedAt: new Date() })
          .where('user_id = :userId', { userId: saved.id })
          .execute();
      }

      const reloaded = await userRepository.findOne({
        where: { id: saved.id },
        relations: { roles: true, company: true, employee: { company: true } }
      });
      if (!reloaded) {
        throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
      }

      return this.toPublicUser(reloaded);
    });
  }

  async setActive(id: number, active: boolean, context: PrincipalTenantContext) {
    return this.update(id, { active }, context);
  }

  async save(user: UserEntity) {
    return this.usersRepository.save(user);
  }

  private resolveRoleNames(requestedRoles: RoleName[], context: PrincipalTenantContext) {
    const normalizedRoles = [...new Set(normalizeRoleNames(requestedRoles))] as RoleName[];
    if (!context.canAccessAll && normalizedRoles.includes(RoleName.ROLE_SUPER_ADMIN)) {
      throw new AppError('FORBIDDEN_ROLE_ASSIGNMENT', 'No puedes asignar el rol superadministrador', 403);
    }
    const invalidRole = normalizedRoles.find((role) => !CONTRACT_ROLES.includes(role));
    if (invalidRole) {
      throw new AppError('FORBIDDEN_ROLE_ASSIGNMENT', `Rol no permitido: ${invalidRole}`, 403);
    }
    return normalizedRoles;
  }

  private async loadRoleEntities(manager: EntityManager, roleNames: RoleName[]) {
    if (!roleNames.length) {
      return [];
    }
    const roles = await manager.getRepository(RoleEntity).find({
      where: roleNames.map((rolNombre) => ({ rolNombre }))
    });
    if (roles.length !== roleNames.length) {
      throw new AppError('ROLE_NOT_FOUND', 'Alguno de los roles no existe', 404);
    }
    return roles;
  }

  private async resolveCompany(manager: EntityManager, companyId: number | null | undefined, context: PrincipalTenantContext) {
    if (companyId === null || companyId === undefined) {
      return null;
    }

    const company = await manager.getRepository(CompanyEntity).findOne({ where: { id: companyId } });
    if (!company) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    this.tenantScope.assertResourceAccess(company.id, context);
    return company;
  }

  private async findEmployee(manager: EntityManager, employeeId: number) {
    const employee = await manager.getRepository(EmployeeEntity).findOne({
      where: { id: employeeId },
      relations: { company: true, user: true, primaryWorkLocation: true }
    });
    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    return employee;
  }

  private async ensureUserUniqueness(
    manager: EntityManager,
    email: string,
    numero: string,
    dni: string,
    excludeId?: number
  ) {
    const qb = manager.getRepository(UserEntity).createQueryBuilder('user');
    qb.where(
      new Brackets((subQuery) => {
        subQuery.where('LOWER(user.email) = :email', { email: email.trim().toLowerCase() });
        subQuery.orWhere('user.numero = :numero', { numero });
        subQuery.orWhere('user.dni = :dni', { dni });
      })
    );
    if (excludeId !== undefined) {
      qb.andWhere('user.id <> :excludeId', { excludeId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new AppError('USER_ALREADY_EXISTS', 'Ya existe un usuario con ese email, login o DNI', 409);
    }
  }

  private async addLastLoginAtSelectIfAvailable(qb: SelectQueryBuilder<UserEntity>) {
    if (await this.hasLastLoginAtColumn()) {
      qb.addSelect('user.lastLoginAt');
    }
  }

  private async hasLastLoginAtColumn() {
    if (!this.lastLoginAtColumnExistsPromise) {
      this.lastLoginAtColumnExistsPromise = this.dataSource
        .query(
          `SELECT COUNT(*) AS count
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'usuarios'
             AND COLUMN_NAME = 'last_login_at'`
        )
        .then((rows) => {
          const row = Array.isArray(rows) ? rows[0] : undefined;
          const count = Number(row?.count ?? row?.COUNT ?? row?.['COUNT(*)'] ?? 0);
          return count > 0;
        })
        .catch(() => false);
    }

    return this.lastLoginAtColumnExistsPromise;
  }
}
