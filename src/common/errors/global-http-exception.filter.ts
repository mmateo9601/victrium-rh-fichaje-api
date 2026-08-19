import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AppError } from './app-error';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId = request.requestId;
    const timestamp = new Date().toISOString();

    if (exception instanceof AppError) {
      response.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        path: request.url,
        timestamp,
        requestId
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message = typeof payload === 'string' ? payload : (payload as { message?: string }).message ?? 'Error';

      response.status(status).json({
        statusCode: status,
        code: HttpStatus[status] ?? 'HTTP_ERROR',
        message,
        path: request.url,
        timestamp,
        requestId
      });
      return;
    }

    response.status(500).json({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
      path: request.url,
      timestamp,
      requestId
    });
  }
}
