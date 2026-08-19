import { LoggerService } from '@nestjs/common';

export class AppLogger implements LoggerService {
  log(message: unknown, context?: string) {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', { message, trace }, context);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  private write(level: string, message: unknown, context?: string) {
    const payload = {
      level,
      context,
      message,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(payload));
  }
}
