import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { normalizeRoleNames } from '../../common/auth/role-access';
import { parseDurationToMilliseconds } from '../../common/time/duration';
import { createAppConfig } from '../../config/env.validation';
import { AuthSessionEntity } from '../../database/entities/auth-session.entity';
import { PublicUserDto } from '../users/dto/public-user.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { TokenService } from '../../common/auth/token.service';

@Injectable()
export class AuthService {
  private readonly config = createAppConfig(process.env);
  private readonly tokenService = new TokenService(this.config);

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(AuthSessionEntity)
    private readonly sessionsRepository: Repository<AuthSessionEntity>
  ) {}

  async login(dto: LoginRequestDto, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailOrFail(dto.email);
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new AppError('INVALID_CREDENTIALS', 'Credenciales invalidas', 401);
    }

    const roles = normalizeRoleNames((user.roles ?? []).map((role) => role.rolNombre));
    const companyId = user.company?.id ?? user.employee?.company?.id ?? null;
    const employeeId = user.employee?.id ?? null;

    const session = await this.sessionsRepository.save(
      this.sessionsRepository.create({
        user,
        refreshTokenHash: 'pending',
        expiresAt: new Date(Date.now() + parseDurationToMilliseconds(this.config.jwt.refreshExpiresIn)),
        userAgent: userAgent ? userAgent.slice(0, 255) : null
      })
    );

    user.lastLoginAt = new Date();
    await this.usersService.save(user);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      numero: user.numero,
      nombreEmpleado: user.nombreEmpleado,
      roles,
      sid: session.id,
      companyId,
      employeeId
    });

    const refreshToken = this.tokenService.signRefreshToken({
      sub: user.id,
      sid: session.id,
      type: 'refresh'
    });

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionsRepository.save(session);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: this.usersService.toPublicUser(user)
    };
  }

  async refresh(dto: RefreshRequestDto): Promise<AuthResponseDto> {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    const session = await this.sessionsRepository.findOne({
      where: { id: payload.sid }
    });

    if (!session || session.revokedAt) {
      throw new AppError('SESSION_REVOKED', 'Sesion revocada o inexistente', 401);
    }

    const tokenMatches = await bcrypt.compare(dto.refreshToken, session.refreshTokenHash);
    if (!tokenMatches) {
      throw new AppError('REFRESH_TOKEN_INVALID', 'Refresh token invalido', 401);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    const roles = normalizeRoleNames((user.roles ?? []).map((role) => role.rolNombre));
    const companyId = user.company?.id ?? user.employee?.company?.id ?? null;
    const employeeId = user.employee?.id ?? null;
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      numero: user.numero,
      nombreEmpleado: user.nombreEmpleado,
      roles,
      sid: session.id,
      companyId,
      employeeId
    });
    const refreshToken = this.tokenService.signRefreshToken({
      sub: user.id,
      sid: session.id,
      type: 'refresh'
    });
    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionsRepository.save(session);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: this.usersService.toPublicUser(user)
    };
  }

  async logout(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const session = await this.sessionsRepository.findOne({ where: { id: payload.sid } });
    if (!session) {
      return {
        message: 'Sesion cerrada correctamente'
      };
    }

    session.revokedAt = new Date();
    await this.sessionsRepository.save(session);

    return {
      message: 'Sesion cerrada correctamente'
    };
  }

  async me(userId: number): Promise<PublicUserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    return this.usersService.toPublicUser(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new AppError('PASSWORD_CONFIRMATION_MISMATCH', 'La confirmacion no coincide', 400);
    }

    const user = await this.usersService.findByIdOrFail(userId);
    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!passwordMatches) {
      throw new AppError('INVALID_CREDENTIALS', 'Credenciales invalidas', 401);
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.sessionsRepository
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId: user.id })
      .execute();
    await this.usersService.save(user);

    return {
      message: 'Password actualizado correctamente'
    };
  }
}
