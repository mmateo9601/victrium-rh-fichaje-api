import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  live() {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      version: '0.2.0'
    };
  }

  async ready() {
    const timestamp = new Date().toISOString();

    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'degraded' as const,
          database: 'down' as const,
          timestamp,
          version: '0.2.0'
        };
      }
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok' as const,
        database: 'up' as const,
        timestamp,
        version: '0.2.0'
      };
    } catch {
      return {
        status: 'degraded' as const,
        database: 'down' as const,
        timestamp,
        version: '0.2.0'
      };
    }
  }

  check() {
    return this.ready();
  }
}
