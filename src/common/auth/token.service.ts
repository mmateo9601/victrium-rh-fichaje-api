import * as jwt from 'jsonwebtoken';

import { AppConfig } from '../../config/env.validation';
import { normalizeRoleNames } from './role-access';

export type AccessTokenPayload = {
  sub: number;
  numero: string;
  nombreEmpleado: string;
  roles: string[];
  sid: string;
  companyId?: number | null;
  employeeId?: number | null;
};

export type RefreshTokenPayload = {
  sub: number;
  sid: string;
  type: 'refresh';
};

export class TokenService {
  constructor(private readonly config: AppConfig) {}

  signAccessToken(payload: AccessTokenPayload) {
    const normalizedPayload = {
      ...payload,
      roles: normalizeRoleNames(payload.roles)
    };
    return jwt.sign(normalizedPayload as unknown as object, this.config.jwt.accessSecret as jwt.Secret, {
      expiresIn: this.config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn']
    });
  }

  signRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign(payload as unknown as object, this.config.jwt.refreshSecret as jwt.Secret, {
      expiresIn: this.config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn']
    });
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, this.config.jwt.accessSecret as jwt.Secret) as unknown as AccessTokenPayload;
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, this.config.jwt.refreshSecret as jwt.Secret) as unknown as RefreshTokenPayload;
  }
}
