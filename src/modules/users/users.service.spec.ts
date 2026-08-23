import { Repository } from 'typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const dataSource = {} as never;
  const tenantScope = {
    applyCompanyScope: jest.fn(),
    assertResourceAccess: jest.fn()
  } as unknown as TenantScopeService;

  function createRepositoryMock() {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn()
    };

    return {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      qb
    } as unknown as Repository<UserEntity> & { qb: typeof qb };
  }

  it('loads the authentication user with a lean query and normalized email', async () => {
    const repository = createRepositoryMock();
    const user = { id: 7, email: 'laura@victrium.local' } as UserEntity;
    repository.qb.getOne.mockResolvedValue(user);

    const service = new UsersService(dataSource, repository, tenantScope);
    const result = await service.findByEmailOrFail('  LAURA@VICTRIUM.LOCAL  ');

    expect(result).toBe(user);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(repository.qb.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'role');
    expect(repository.qb.leftJoinAndSelect).toHaveBeenCalledWith('user.company', 'company');
    expect(repository.qb.leftJoinAndSelect).toHaveBeenCalledWith('user.employee', 'employee');
    expect(repository.qb.leftJoinAndSelect).toHaveBeenCalledWith('employee.company', 'employeeCompany');
    expect(repository.qb.where).toHaveBeenCalledWith('LOWER(user.email) = :email', { email: 'laura@victrium.local' });
  });

  it('throws when the email does not exist', async () => {
    const repository = createRepositoryMock();
    repository.qb.getOne.mockResolvedValue(null);

    const service = new UsersService(dataSource, repository, tenantScope);

    await expect(service.findByEmailOrFail('missing@example.com')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      statusCode: 404
    });
  });

  it('loads users by id with the same lean query shape', async () => {
    const repository = createRepositoryMock();
    const user = { id: 9, email: 'admin@victrium.local' } as UserEntity;
    repository.qb.getOne.mockResolvedValue(user);

    const service = new UsersService(dataSource, repository, tenantScope);
    const result = await service.findById(9);

    expect(result).toBe(user);
    expect(repository.qb.where).toHaveBeenCalledWith('user.id = :id', { id: 9 });
  });

  it('finds users by number or email with normalized email matching', async () => {
    const repository = createRepositoryMock();
    const user = { id: 10, email: 'operations@acme.local' } as UserEntity;
    repository.qb.getOne.mockResolvedValue(user);

    const service = new UsersService(dataSource, repository, tenantScope);
    const result = await service.findByNumeroOrEmail('  OPERATIONS@ACME.LOCAL  ');

    expect(result).toBe(user);
    expect(repository.qb.where).toHaveBeenCalledWith('user.numero = :identifier', { identifier: '  OPERATIONS@ACME.LOCAL  ' });
    expect(repository.qb.orWhere).toHaveBeenCalledWith('LOWER(user.email) = :normalizedIdentifier', {
      normalizedIdentifier: 'operations@acme.local'
    });
  });
});
