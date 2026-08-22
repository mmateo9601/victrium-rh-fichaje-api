import { LoggerService } from '@nestjs/common';

export class AppLogger implements LoggerService {
  constructor(private readonly minimumLevel: 'error' | 'warn' | 'log' | 'verbose' | 'debug' = 'log') {}

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
    if (!this.shouldLog(level)) {
      return;
    }

    const payload = {
      level,
      context,
      message,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }

  private shouldLog(level: string) {
    const priorities: Record<string, number> = {
      error: 0,
      warn: 1,
      log: 2,
      verbose: 3,
      debug: 4
    };

    return (priorities[level] ?? 99) <= priorities[this.minimumLevel];
  }
}
