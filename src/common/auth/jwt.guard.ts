import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { createAppConfig } from '../../config/env.validation';
import { AppError } from '../errors/app-error';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Missing bearer token', 401);
    }

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
}
