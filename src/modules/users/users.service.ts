import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { RoleName } from '../../database/entities/role-name.enum';
import { UserEntity } from '../../database/entities/user.entity';
import { PublicUserDto } from './dto/public-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>
  ) {}

  async findByNumero(numero: string) {
    return this.usersRepository.findOne({
      where: { numero }
    });
  }

  async findById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByNumeroOrFail(numero: string) {
    const user = await this.findByNumero(numero);
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
      roles: (user.roles ?? []).map((role) => role.rolNombre),
      admin: Boolean(user.admin)
    };
  }

  isRrhhOrAdmin(user: UserEntity) {
    const roles = (user.roles ?? []).map((role) => role.rolNombre);
    return roles.includes(RoleName.ROLE_ADMIN) || roles.includes(RoleName.ROLE_RRHH) || Boolean(user.admin);
  }
}
