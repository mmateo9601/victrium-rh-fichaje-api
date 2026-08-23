import { Repository } from 'typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const tenantScope = {
    applyCompanyScope: jest.fn(),
    assertResourceAccess: jest.fn()
  } as unknown as TenantScopeService;

  function createRepositoryMock() {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
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

    const service = new UsersService(repository, tenantScope);
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

    const service = new UsersService(repository, tenantScope);

    await expect(service.findByEmailOrFail('missing@example.com')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      statusCode: 404
    });
  });
});
