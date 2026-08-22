import * as bcrypt from 'bcryptjs';
import { DataSource, EntityManager } from 'typeorm';

import { AppError } from '../common/errors/app-error';
import { AppConfig, createAppConfig } from '../config/env.validation';
import { RoleName } from '../database/entities/role-name.enum';
import { RoleEntity } from '../database/entities/role.entity';
import { UserEntity } from '../database/entities/user.entity';

export type SuperAdminBootstrapResult = 'disabled' | 'created' | 'already_exists';

type BootstrapPayload = {
  email: string;
  password: string;
  name: string;
  numero: string;
  dni: string;
};

export class SuperAdminBootstrapService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: AppConfig = createAppConfig(process.env)
  ) {}

  async run(): Promise<SuperAdminBootstrapResult> {
    if (!this.config.bootstrap.superAdmin.enabled) {
      process.stdout.write('Super admin bootstrap disabled\n');
      return 'disabled';
    }

    const payload = this.buildPayload();
    const passwordHash = await bcrypt.hash(payload.password, 10);

    return this.dataSource.transaction(async (manager) => this.runInTransaction(manager, payload, passwordHash));
  }

  private buildPayload(): BootstrapPayload {
    const email = this.config.bootstrap.superAdmin.email?.trim().toLowerCase();
    const password = this.config.bootstrap.superAdmin.password;
    if (!email || !password) {
      throw new AppError('SUPER_ADMIN_BOOTSTRAP_INVALID', 'Super admin bootstrap is not properly configured', 400);
    }

    const name = this.config.bootstrap.superAdmin.name?.trim() || 'Super Admin';
    return {
      email,
      password,
      name,
      numero: email,
      dni: `super-admin:${email}`
    };
  }

  private async runInTransaction(
    manager: EntityManager,
    payload: BootstrapPayload,
    passwordHash: string
  ): Promise<SuperAdminBootstrapResult> {
    const roleRepository = manager.getRepository(RoleEntity);
    const userRepository = manager.getRepository(UserEntity);

    let superAdminRole = await roleRepository.findOne({
      where: { rolNombre: RoleName.ROLE_SUPER_ADMIN }
    });

    if (!superAdminRole) {
      superAdminRole = roleRepository.create({ rolNombre: RoleName.ROLE_SUPER_ADMIN });
      superAdminRole = await roleRepository.save(superAdminRole);
    }

    const existingUser = await userRepository.findOne({
      where: { email: payload.email },
      relations: {
        roles: true
      }
    });

    if (existingUser) {
      const hasSuperAdminRole = (existingUser.roles ?? []).some((role) => role.rolNombre === RoleName.ROLE_SUPER_ADMIN);
      if (hasSuperAdminRole) {
        process.stdout.write('Super admin already exists\n');
        return 'already_exists';
      }

      throw new AppError(
        'SUPER_ADMIN_BOOTSTRAP_CONFLICT',
        'An existing user uses the bootstrap email without the SUPER_ADMIN role',
        409
      );
    }

    const user = userRepository.create({
      email: payload.email,
      password: passwordHash,
      numero: payload.numero,
      nombreEmpleado: payload.name,
      dni: payload.dni,
      admin: true,
      company: null,
      employee: null,
      roles: [superAdminRole]
    });

    await userRepository.save(user);
    process.stdout.write('Super admin created\n');
    return 'created';
  }
}
