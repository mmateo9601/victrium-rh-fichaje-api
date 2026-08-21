import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { createAppConfig } from '../../config/env.validation';
import { AppError } from '../errors/app-error';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = request.headers.authorization;

    if (header?.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length);
      const config = createAppConfig(process.env);

      try {
        const payload = jwt.verify(token, config.jwt.accessSecret) as Record<string, unknown>;
        request.user = payload;
        return true;
      } catch {
        throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
      }
    }

    const apiKeyHeader = request.headers['x-api-key'];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    if (typeof apiKey === 'string' && apiKey.trim()) {
      const apiKeysService = this.moduleRef.get(ApiKeysService, { strict: false });
      if (!apiKeysService) {
        throw new AppError('INTERNAL_ERROR', 'API key service unavailable', 500);
      }

      const principal = await apiKeysService.authenticate(apiKey.trim());
      if (!principal) {
        throw new AppError('UNAUTHORIZED', 'Invalid or expired API key', 401);
      }

      request.user = principal;
      return true;
    }

    throw new AppError('UNAUTHORIZED', 'Missing bearer token or API key', 401);
  }
}
