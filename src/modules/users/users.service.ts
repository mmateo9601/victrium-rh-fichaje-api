import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RoleName } from '../../database/entities/role-name.enum';
import { RoleEntity } from '../../database/entities/role.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PublicUserDto } from './dto/public-user.dto';

type UsersListQuery = PaginationQueryDto & {
  search?: string;
  role?: RoleName | string;
  active?: string | boolean;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async findByNumero(numero: string) {
    return this.usersRepository.findOne({
      where: { numero },
      relations: {
        roles: true,
        company: true,
        employee: {
          company: true
        }
      }
    });
  }

  async findByNumeroOrEmail(identifier: string) {
    return this.usersRepository.findOne({
      where: [{ numero: identifier }, { email: identifier }],
      relations: {
        roles: true,
        company: true,
        employee: {
          company: true
        }
      }
    });
  }

  async findById(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: {
        roles: true,
        company: true,
        employee: {
          company: true
        }
      }
    });
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

  async findByIdOrFail(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    return user;
  }

  toPublicUser(user: UserEntity): PublicUserDto {
    return {
      id: user.id,
      numero: user.numero,
      nombreEmpleado: user.nombreEmpleado,
      companyId: user.company?.id ?? user.employee?.company?.id ?? null,
      employeeId: user.employee?.id ?? null,
      roles: (user.roles ?? []).map((role) => role.rolNombre),
      admin: Boolean(user.admin)
    };
  }

  isRrhhOrAdmin(user: UserEntity) {
    const roles = (user.roles ?? []).map((role) => role.rolNombre);
    return (
      roles.includes(RoleName.ROLE_SUPER_ADMIN) ||
      roles.includes(RoleName.ROLE_ADMIN) ||
      roles.includes(RoleName.ROLE_COMPANY_ADMIN) ||
      roles.includes(RoleName.ROLE_RRHH) ||
      Boolean(user.admin)
    );
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

    if (query.search) {
      qb.andWhere(
        '(user.email LIKE :search OR user.numero LIKE :search OR user.nombreEmpleado LIKE :search OR user.dni LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.role) {
      qb.andWhere('role.rolNombre = :role', { role: query.role });
    }

    if (query.active !== undefined) {
      const active =
        query.active === true || query.active === 'true' ? true : query.active === false || query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('user.deBaja = :deBaja', { deBaja: !active });
      }
    }

    this.tenantScope.applyCompanyScope(qb, 'user', context, {
      selfAlias: 'user',
      selfId: context.userId
    });

    qb.distinct(true);

    const allowedSortFields = new Set(['id', 'numero', 'nombreEmpleado', 'email', 'dni', 'deBaja']);
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

  async updateEmployeeLink(user: UserEntity, employee: EmployeeEntity | null, company?: CompanyEntity | null) {
    user.employee = employee;
    user.company = company ?? employee?.company ?? null;
    return this.usersRepository.save(user);
  }

  async syncUserRoleSet(user: UserEntity, roles: RoleEntity[]) {
    user.roles = roles;
    return this.usersRepository.save(user);
  }

  async save(user: UserEntity) {
    return this.usersRepository.save(user);
  }
}
